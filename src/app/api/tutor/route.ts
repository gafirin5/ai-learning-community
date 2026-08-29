import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * Server-side proxy untuk AI Tutor.
 * - API key LLM TIDAK PERNAH sampai ke browser (server-only env).
 * - Verifikasi user via Supabase token di header Authorization.
 * - Kuota harian via RPC check_chat_quota / update_chat_quota (konteks authenticated).
 */

const DAILY_LIMIT = 20;
const MAX_MESSAGES = 30;
const MAX_MSG_CHARS = 6000;
const MAX_TOTAL_CHARS = 24000;

function llmConfig() {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || "https://api.kagiro.net/v1";
  const model = process.env.LLM_MODEL || "kagiro/qwen3-8max";
  return { apiKey, baseUrl: baseUrl.replace(/\/+$/, ""), model };
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(lessonTitle?: string, courseTitle?: string): string {
  const ctx: string[] = [];
  if (courseTitle) ctx.push(`Kursus: ${courseTitle}`);
  if (lessonTitle) ctx.push(`Materi: ${lessonTitle}`);

  return [
    "Kamu adalah tutor AI untuk platform komunitas belajar AI berbahasa Indonesia.",
    "Peranmu: menjelaskan konsep, membantu latihan, dan membimbing pemahaman materi.",
    "Aturan:",
    "1. Jawab dalam Bahasa Indonesia yang jelas dan ramah.",
    "2. Sesuaikan kedalaman dengan level pembelajar; mulai dari intuisi sebelum formal.",
    "3. Gunakan contoh konkret dan analogi bila membantu; format jawaban dengan markdown ringan.",
    "4. Jawab ringkas (150-400 kata) kecuali diminta detail.",
    "5. Jika pertanyaan di luar topik AI/ML/data, arahkan kembali dengan sopan.",
    ctx.length ? `Konteks sesi ini — ${ctx.join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: NextRequest) {
  const { apiKey, baseUrl, model } = llmConfig();
  if (!apiKey) {
    return jsonError(500, "LLM belum dikonfigurasi di server (LLM_API_KEY kosong).");
  }

  // 1. Verifikasi user dari token Supabase
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return jsonError(401, "Login dulu untuk memakai AI Tutor.");

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userData?.user) return jsonError(401, "Sesi tidak valid. Login ulang.");
  const uuid = userData.user.id;

  // 2. Validasi body
  let body: {
    messages?: { role: string; content: string }[];
    lessonId?: number;
    lessonTitle?: string;
    courseTitle?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Body JSON tidak valid.");
  }

  const msgs = Array.isArray(body.messages) ? body.messages : [];
  const valid = msgs.every(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.length <= MAX_MSG_CHARS
  );
  if (!valid || msgs.length === 0 || msgs.length > MAX_MESSAGES) {
    return jsonError(400, "Percakapan tidak valid atau terlalu panjang.");
  }
  const totalChars = msgs.reduce((a, m) => a + m.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) return jsonError(400, "Percakapan terlalu panjang.");

  // 3. Cek kuota harian (dijalankan sebagai user, bukan anon)
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
  const { data: quotaRows, error: quotaErr } = await userClient.rpc("check_chat_quota", {
    p_user_id: uuid,
    p_daily_limit: DAILY_LIMIT,
  });
  if (quotaErr) return jsonError(500, "Gagal memeriksa kuota: " + quotaErr.message);
  const quota = Array.isArray(quotaRows) ? quotaRows[0] : quotaRows;
  if (quota && quota.can_request === false) {
    return jsonError(429, "Kuota harian AI Tutor habis. Coba lagi besok.");
  }

  // Data untuk simpan riwayat chat di blok finally (di-capture sebelum stream
  // dibuat supaya tidak bergantung pada lifecycle ReadableStream).
  // Client selalu mengirim message user di posisi terakhir; defensive:
  // bila bukan, ambil message user terakhir dari history.
  const lastMsg = msgs[msgs.length - 1];
  const lastUserContent =
    lastMsg.role === "user"
      ? lastMsg.content
      : msgs.filter((m) => m.role === "user").pop()?.content ?? "";
  const historyLessonId = typeof body.lessonId === "number" ? body.lessonId : null;

  // 4. Panggil LLM (OpenAI-compatible) dengan streaming
  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        { role: "system", content: buildSystemPrompt(body.lessonTitle, body.courseTitle) },
        ...msgs.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return jsonError(502, "Penyedia LLM bermasalah: " + detail.slice(0, 200));
  }

  // 5. Stream passthrough + hitung pemakaian di akhir
  const decoder = new TextDecoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
          fullText += decoder.decode(value, { stream: true });
        }
      } catch {
        // koneksi upstream putus ATAU client disconnect — client sudah menerima sebagian
      } finally {
        // close() bisa throw bila stream sudah errored/closed (mis. client
        // disconnect) — jangan biarkan itu mencegah pencatatan kuota.
        try {
          controller.close();
        } catch {
          /* sudah closed */
        }
        // Estimasi token: ~4 char/token, minimum 100
        const estTokens = Math.max(100, Math.ceil(fullText.length / 4));
        const { error: quotaUpdateErr } = await userClient.rpc("update_chat_quota", {
          p_user_id: uuid,
          p_tokens: estTokens,
          p_reset_date: new Date().toISOString().slice(0, 10),
        });
        if (quotaUpdateErr) {
          console.error("[tutor] update_chat_quota failed:", quotaUpdateErr.message);
        }

        // Simpan riwayat chat (best-effort — kegagalan tidak mempengaruhi
        // response yang sudah dikirim). RLS owner via userClient (token user).
        try {
          const historyRows: {
            user_id: string;
            lesson_id: number | null;
            role: "user" | "assistant";
            message: string;
          }[] = [];
          if (lastUserContent) {
            historyRows.push({
              user_id: uuid,
              lesson_id: historyLessonId,
              role: "user",
              message: lastUserContent,
            });
          }
          if (fullText) {
            historyRows.push({
              user_id: uuid,
              lesson_id: historyLessonId,
              role: "assistant",
              message: fullText,
            });
          }
          if (historyRows.length > 0) {
            const { error: historyErr } = await userClient
              .from("chat_history")
              .insert(historyRows);
            if (historyErr) {
              console.error("[tutor] save history failed:", historyErr.message);
            }
          }
        } catch (historyExc) {
          console.error("[tutor] save history failed:", historyExc);
        }
      }
    },
  });

  const responseHeaders: Record<string, string> = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Quota-Limit": String(DAILY_LIMIT),
  };
  if (quota && typeof quota.remaining === "number") {
    responseHeaders["X-Quota-Remaining"] = String(quota.remaining);
  }

  return new Response(stream, { headers: responseHeaders });
}

// GET: riwayat chat user (maks 50, ascending). Query param opsional: lessonId.
export async function GET(req: NextRequest) {
  // Verifikasi user dari token Supabase — pola sama dengan POST.
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return jsonError(401, "Login dulu untuk memakai AI Tutor.");

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userData?.user) return jsonError(401, "Sesi tidak valid. Login ulang.");
  const uuid = userData.user.id;

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const lessonIdParam = req.nextUrl.searchParams.get("lessonId");
  let lessonId: number | null = null;
  if (lessonIdParam !== null) {
    lessonId = Number(lessonIdParam);
    if (!Number.isFinite(lessonId)) return jsonError(400, "lessonId tidak valid.");
  }

  // RLS owner sudah membatasi per user; eq user_id eksplisit tetap dipasang
  // (defensive, konsisten pola repo).
  let historyQuery = userClient
    .from("chat_history")
    .select("role, message, created_at")
    .eq("user_id", uuid);
  if (lessonId !== null) historyQuery = historyQuery.eq("lesson_id", lessonId);
  const { data, error } = await historyQuery
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) return jsonError(500, "Gagal memuat riwayat chat: " + error.message);

  const rows = (data ?? []) as { role?: unknown; message?: unknown; created_at?: unknown }[];
  const messages = rows
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({
      role: r.role as "user" | "assistant",
      content: typeof r.message === "string" ? r.message : "",
      createdAt: typeof r.created_at === "string" ? r.created_at : "",
    }));

  // Kuota tersisa (best-effort — riwayat tetap dikembalikan walau RPC gagal).
  let quotaRemaining: number | null = null;
  try {
    const { data: quotaRows } = await userClient.rpc("check_chat_quota", {
      p_user_id: uuid,
      p_daily_limit: DAILY_LIMIT,
    });
    const quota = Array.isArray(quotaRows) ? quotaRows[0] : quotaRows;
    if (quota && typeof quota.remaining === "number") quotaRemaining = quota.remaining;
  } catch {
    /* abaikan */
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (quotaRemaining !== null) headers["X-Quota-Remaining"] = String(quotaRemaining);

  return new Response(JSON.stringify({ messages }), { headers });
}
