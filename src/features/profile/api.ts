/**
 * Profil — Remote API layer (Supabase).
 *
 * Owner: Lane F (Profil)
 *
 * Pola mengikuti src/features/mentor/api.ts & api-write.ts: query Supabase
 * → error throw (pesan bahasa Indonesia) → mapping row dengan helper `str`/
 * `strArr`. uuid user sendiri selalu dari session (auth.getUser), bukan hash
 * number — RLS `profiles` mengizinkan update baris milik sendiri.
 *
 * CATATAN: file ini sengaja TIDAK menyentuh src/lib/api.ts / api-write.ts
 * (milik lane lain).
 */

import { getSupabase } from "@/lib/supabase";

type Row = { [key: string]: unknown };

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  expertise?: string[];
}

export interface UpdateProfileResult {
  name: string;
  bio: string;
  avatarUrl: string;
  expertise: string[];
}

/**
 * Perbarui profil user yang sedang login di tabel `profiles`.
 * Field yang `undefined` tidak dikirim (tidak menimpa nilai lama); string
 * kosong tetap dikirim agar user bisa mengosongkan bio/avatarUrl/expertise.
 * Mengembalikan nilai terbaru dari DB (select setelah update).
 */
export async function updateProfileRemote(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const supabase = getSupabase();
  const { data: authData } = await supabase.auth.getUser();
  const uuid = authData.user?.id;
  if (!uuid) throw new Error("Login diperlukan untuk memperbarui profil.");

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.bio !== undefined) patch.bio = input.bio.trim();
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl.trim();
  if (input.expertise !== undefined) {
    patch.expertise = input.expertise.map((s) => s.trim()).filter(Boolean);
  }
  if (Object.keys(patch).length === 0) {
    throw new Error("Tidak ada perubahan yang perlu disimpan.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", uuid)
    .select("name, bio, avatar_url, expertise")
    .single();

  if (error) {
    const detail = error.message ? error.message : "coba lagi nanti";
    throw new Error(`Gagal menyimpan profil (${detail}).`);
  }
  const row = (data ?? {}) as Row;
  return {
    name: str(row.name),
    bio: str(row.bio),
    avatarUrl: str(row.avatar_url),
    expertise: strArr(row.expertise),
  };
}
