"use client";

// Kartu Hafalan (fitur Lab) — SRS SM-2 dihitung di client (src/lib/srs/sm2.ts),
// progres di-persist per user di tabel flashcard_progress. Antrean: kartu baru
// + kartu jatuh tempo hari ini, sesi maks 10 kartu.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { flashcards } from "@/lib/data";
import {
  dueAtFrom,
  reviewSm2,
  SRS_INITIAL_STATE,
  todayKey,
  type SrsRating,
} from "@/lib/srs/sm2";
import { fetchMyFlashcardProgress, upsertFlashcardReview } from "@/lib/store/flashcards-remote";
import type { Flashcard, FlashcardProgress } from "@/lib/types";
import { useLabFlag } from "@/lib/flags";
import { useToast } from "@/components/toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ProgressBar } from "@/components/progress";

const SESSION_SIZE = 10;

const RATING_META: { rating: SrsRating; label: string; className: string }[] = [
  { rating: "again", label: "Ulangi", className: "border-danger/40 text-danger hover:bg-danger-soft" },
  { rating: "hard", label: "Sulit", className: "border-warning/40 text-warning hover:bg-warning-soft" },
  { rating: "good", label: "Baik", className: "border-success/40 text-success hover:bg-success-soft" },
  { rating: "easy", label: "Mudah", className: "border-brand/40 text-brand hover:bg-brand-soft" },
];

export default function FlashcardsPage() {
  const { state } = useStore();
  const { toast } = useToast();
  const [enabled, , flagReady] = useLabFlag("flashcards");
  const isLoggedIn = state.currentUserId != null;
  const remoteOn = isSupabaseConfigured();

  const [progressMap, setProgressMap] = useState<Record<number, FlashcardProgress>>({});
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lessonFilter, setLessonFilter] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = remoteOn && isLoggedIn ? await fetchMyFlashcardProgress() : [];
      const map: Record<number, FlashcardProgress> = {};
      for (const r of rows) map[r.cardId] = r;
      setProgressMap(map);

      const lessonParam = Number(new URLSearchParams(window.location.search).get("lesson"));
      const lesson = Number.isFinite(lessonParam) && lessonParam > 0 ? lessonParam : null;
      setLessonFilter(lesson);

      const today = todayKey();
      const pool = flashcards
        .filter((c) => lesson == null || c.lessonId === lesson)
        .filter((c) => {
          const p = map[c.id];
          return !p || !p.dueAt || p.dueAt <= today;
        });
      // Paling jatuh tempo dulu (kartu baru — tanpa progres — paling akhir).
      pool.sort((a, b) => (map[a.id]?.dueAt ?? "9999-12-31").localeCompare(map[b.id]?.dueAt ?? "9999-12-31"));
      setQueue(pool.slice(0, SESSION_SIZE));
      setPos(0);
      setFlipped(false);
      setReviewedCount(0);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Gagal memuat kartu hafalan.");
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, [remoteOn, isLoggedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const card = queue[pos] ?? null;
  const cardProgress = card
    ? progressMap[card.id] ?? {
        ...SRS_INITIAL_STATE,
        cardId: card.id,
        dueAt: todayKey(),
        lastReviewedAt: null,
      }
    : null;

  // Preview interval tiap tombol rating (dry-run SM-2, tidak menyimpan).
  function previewInterval(rating: SrsRating): string {
    if (!cardProgress) return "";
    const next = reviewSm2(cardProgress, rating);
    return `+${next.intervalDays} hr`;
  }

  async function handleRate(rating: SrsRating) {
    if (!card || !cardProgress || busy) return;
    setBusy(true);
    const next = reviewSm2(cardProgress, rating);
    const updated: FlashcardProgress = {
      ...next,
      cardId: card.id,
      dueAt: dueAtFrom(new Date(), next.intervalDays),
      lastReviewedAt: new Date().toISOString(),
    };
    setProgressMap((m) => ({ ...m, [card.id]: updated }));
    try {
      if (remoteOn && isLoggedIn) await upsertFlashcardReview(updated);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menyimpan review.", "error");
    } finally {
      setBusy(false);
      setFlipped(false);
      setReviewedCount((n) => n + 1);
      // Kartu "Ulangi" masuk lagi ke akhir antrean (belajar ulang dalam sesi).
      if (rating === "again") setQueue((q) => [...q, card]);
      setPos((p) => p + 1);
    }
  }

  // ===== Gate tampilan (hooks sudah selesai di atas) =====
  if (flagReady && !enabled) {
    return (
      <div className="container-app py-16 text-center">
        <p className="mb-3 text-4xl" aria-hidden="true">🧪</p>
        <h1 className="text-2xl font-bold text-content">Kartu Hafalan sedang di Lab</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Fitur ini masih eksperimental dan nonaktif di perangkatmu. Aktifkan dari halaman Lab
          untuk mencobanya.
        </p>
        <Link href="/labs" className="btn-primary mt-5">
          Buka Lab
        </Link>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container-app py-16 text-center">
        <p className="mb-3 text-4xl" aria-hidden="true">🃏</p>
        <h1 className="text-2xl font-bold text-content">Kartu Hafalan</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Ulangi materi pelajaran dengan algoritma spaced repetition SM-2 — kartu muncul kembali
          tepat sebelum kamu kemungkinan lupa. Masuk untuk mulai melatih.
        </p>
        <Link href="/login?redirect=/flashcards" className="btn-primary mt-5">
          Masuk untuk melatih
        </Link>
      </div>
    );
  }

  const lessonTitle = lessonFilter != null
    ? state.lessons.find((l) => l.id === lessonFilter)?.title ?? null
    : null;
  const dueToday = flashcards.filter((c) => {
    const p = progressMap[c.id];
    return !p || !p.dueAt || p.dueAt <= todayKey();
  }).length;
  const sessionProgress = queue.length > 0 ? Math.min(100, Math.round((pos / queue.length) * 100)) : 100;

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold text-content">🃏 Kartu Hafalan</h1>
          <span className="badge bg-warning-soft text-warning">Eksperimental</span>
        </div>
        <p className="max-w-2xl text-muted">
          Ulangi materi dengan algoritma spaced repetition SM-2 — nilai kualitas ingatanmu, dan
          kartu akan dijadwalkan muncul kembali tepat sebelum kemungkinan lupa.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>📅 {dueToday} kartu jatuh tempo hari ini</span>
          <span>🗂 {flashcards.length} total kartu</span>
          {lessonTitle && (
            <Link
              href="/flashcards"
              className="badge bg-brand-soft text-brand underline-offset-2 hover:underline"
            >
              📖 {lessonTitle} — hapus filter ✕
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card mx-auto max-w-xl p-10 text-center" aria-busy="true">
          <div className="mx-auto h-40 w-full max-w-md animate-pulse rounded-xl bg-surface-hover" />
        </div>
      ) : loadError ? (
        <div className="card mx-auto max-w-xl p-10 text-center">
          <p className="mb-4 text-sm text-danger">{loadError}</p>
          <button type="button" onClick={() => void load()} className="btn-secondary">
            Coba lagi
          </button>
        </div>
      ) : !card ? (
        <div className="card mx-auto max-w-xl p-10 text-center">
          <p className="mb-2 text-4xl" aria-hidden="true">🎉</p>
          <p className="font-semibold text-content">
            {reviewedCount > 0 ? "Sesi selesai!" : "Tidak ada kartu jatuh tempo hari ini"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {reviewedCount > 0
              ? `Kamu mengulas ${reviewedCount} kartu. Kartu berikutnya muncul sesuai jadwal SM-2.`
              : dueToday === 0
                ? "Semua kartu sudah dijadwalkan. Kembali lagi besok!"
                : "Coba muat ulang sesi."}
          </p>
          <button type="button" onClick={() => void load()} className="btn-secondary mt-4">
            Muat ulang sesi
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-xl">
          {/* Progress sesi */}
          <div className="mb-4 flex items-center gap-3">
            <ProgressBar value={sessionProgress} className="h-2 flex-1" />
            <span className="shrink-0 text-xs font-semibold text-muted">
              {Math.min(pos + 1, queue.length)}/{queue.length}
            </span>
          </div>

          {/* Flip card (CSS 3D murni) */}
          <div className="[perspective:1200px]">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? "Lihat pertanyaan" : "Tampilkan jawaban"}
              className="relative block h-72 w-full text-left transition-transform duration-500 [transform-style:preserve-3d]"
              style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              <div className="card absolute inset-0 flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
                <span className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">
                  Pertanyaan
                </span>
                <p className="text-center text-lg font-semibold text-content">{card.front}</p>
                {card.hint && <p className="mt-4 text-center text-xs text-muted">💡 {card.hint}</p>}
                <span className="mt-8 text-xs text-muted">Klik kartu untuk melihat jawaban</span>
              </div>
              <div
                className="card absolute inset-0 flex flex-col items-center justify-center border-brand/30 bg-brand-soft p-8 [backface-visibility:hidden]"
                style={{ transform: "rotateY(180deg)" }}
              >
                <span className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">
                  Jawaban
                </span>
                <p className="text-center text-base font-medium text-content">{card.back}</p>
                <span className="mt-8 text-xs text-muted">Seberapa mudah mengingatnya?</span>
              </div>
            </button>
          </div>

          {/* Rating ala Anki dengan preview interval */}
          {flipped && (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RATING_META.map(({ rating, label, className }) => (
                <button
                  key={rating}
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRate(rating)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${className}`}
                  title={`Interval berikutnya: ${previewInterval(rating)}`}
                >
                  {label}
                  <span className="block text-[11px] font-normal opacity-75">
                    {previewInterval(rating)}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!flipped && (
            <p className="mt-5 text-center text-xs text-muted">
              Ingat jawabannya dulu, lalu buka kartu untuk menilai dirimu.
            </p>
          )}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-muted">
        Fitur eksperimental — kelola dari{" "}
        <Link href="/labs" className="font-medium text-brand underline-offset-2 hover:underline">
          halaman Lab
        </Link>
        .
      </p>
    </div>
  );
}
