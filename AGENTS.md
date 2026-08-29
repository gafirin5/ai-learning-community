# AGENTS.md — Panduan Kerja Paralel Multi-Agent 🌐 Global

Repo ini adalah **Next.js 14 App Router (React 18 + Tailwind)** murni frontend-only.
State global di `src/lib/store` (persist ke `localStorage` key `aic-store-v1`).

> Diagram `my-project/` pada permintaan = **`ai-learning-community/`** di repo ini. Hierarki fisik `apps/` & `packages/` baru berisi `AGENTS.md`; kode masih di `src/` sampai PR migrasi penuh.

## Aturan Utama

1. Jangan edit file di luar lane tanpa mention di PR / approval gatekeeper.
2. `main` protected. Kerja di `feat/<lane>-<short-desc>`, rebase dari `main` terbaru sebelum PR.
3. Perubahan file global (`site-header.tsx`, `globals.css`, `layout.tsx`, `tailwind.config.ts`) harus via PR kecil yang di-review gatekeeper (Lane A).
4. Jangan push langsung ke `main`. Tidak ada `--force` ke `main`.

## Cara Membaca Hierarki

- **Root ini = aturan global** (branch/PR, verifikasi, keputusan struktur). Berlaku untuk semua agen.
- **Nested = aturan spesifik domain.** Saat bekerja di path `apps/web/**` baca [`apps/web/AGENTS.md`](apps/web/AGENTS.md) dulu; `apps/api/**` → [`apps/api/AGENTS.md`](apps/api/AGENTS.md); `packages/ui/**` → [`packages/ui/AGENTS.md`](packages/ui/AGENTS.md). Root sebagai fallback.
- **Precedence:** `root < nested`. Nested boleh memperjelas/mengetatkan, tidak boleh melonggarkan Aturan Utama.
- **Catatan ZCode:** Loader ZCode saat ini hanya inject root `AGENTS.md` (`~/.zcode/AGENTS.md` + `<repo>/AGENTS.md`). Nested **tidak auto-merge** — agen wajib `Read` file terdekat secara manual. Checklist PR: "sudah baca AGENTS.md terdekat?".

## Kepemilikan Lane — Index Delegasi

| Domain | AGENTS.md | Lane | Catatan |
|--------|-----------|------|---------|
| **apps/web** — Frontend | [`apps/web/AGENTS.md`](apps/web/AGENTS.md) | B, C, D, E, F, G, H | Detail lane + slice ada di nested; kode fisik masih di `src/` |
| **apps/api** — Backend | [`apps/api/AGENTS.md`](apps/api/AGENTS.md) | (future) | Placeholder — belum ada `apps/api/src`, persistensi masih `localStorage` |
| **packages/ui** — Shared UI | [`packages/ui/AGENTS.md`](packages/ui/AGENTS.md) | A (gatekeeper) | Komponen pure presentational + design tokens |

> Tabel lengkap per lane (direktori/file yang dimiliki) dipindah ke masing-masing nested agar root tidak duplikasi.

## Struktur Slice — Ringkas

- Slice terpisah: `src/lib/types/*` (`common`, `course`, `forum`, `project`, `progress`, `chat`, `interest`, `store`), `src/lib/data/*`, `src/lib/store/*` (`context`, `initial`, `persistence`, ...). Shim `types.ts`/`data.ts`/`store.tsx`/`types-helpers.ts` sudah dihapus (Fase 1: `1f9f495`); `src/lib/tutor.ts` sisa sebagai re-export kompatibilitas.
- **Aturan emas:** Jangan edit `src/lib/store/<slice milik lane lain>` tanpa koordinasi. Kode baru impor dari slice, bukan shim.
- Detail aturan & konvensi slice → [`apps/web/AGENTS.md`](apps/web/AGENTS.md) dan [`packages/ui/AGENTS.md`](packages/ui/AGENTS.md).

## Alur Kerja (Branch & PR)

- Branch: `feat/<lane>-<deskripsi-singkat>` dari `main` terbaru.
- Commit kecil, push harian, rebase dari `main` tiap 1-2 hari.
- PR per lane → review silang (fokus cek `store` slice & `site-header`).
- Merge ke `main` satu per satu (squash), bukan bersamaan.
- Verifikasi lokal sebelum PR: `npm run lint && npx tsc --noEmit && npm run build` harus hijau (CI juga cek ini).

## Catatan Selesai (wajib diisi agent saat plannya beres)

Setiap agent yang menyelesaikan plannya **wajib** menambahkan entri di tabel ini sebelum merge ke `main`.
Format entri: `| Tanggal | Agent/Lane | Plan/Rencana | Status | Catatan/Coverage |`.

| Tanggal | Agent / Lane | Plan / Rencana | Status | Catatan / Coverage |
|---------|--------------|----------------|--------|---------------------|
| *contoh: 2026-08-27* | *Agent 1 / Lane B (Auth)* | *Slicing store + onboarding* | *Selesai* | *lint/tsc/build hijau, PR #12* |
| 2026-08-27 | Fondasi / multi-agent (Plan A) | Slice store/types/data + AGENTS delegasi + CODEOWNERS/CI (`0879781`) | Selesai | lint/tsc/build hijau (14 routes), PR fondasi — 33 files |
| 2026-08-27 | Fase 1 penataan `src/` (Plan B) | Hapus shim duplikat, pecah tutor->initial/ai/quota/utils, providers->app, kelompokkan components, betulkan tailwind/.gitignore/README (`1f9f495`) | Selesai | lint 0, tsc 0, build 14/14 hijau, push `1f9f495` |
| 2026-08-27 | Fase 1 lanjutan — tipe | Pecah `types/progress.ts`->`chat.ts`/`interest.ts` + header god-file sisa (`a63018e`) | Selesai | tsc 0, lint 0, build 14/14 hijau, push `a63018e` |
| 2026-08-28 | Lane I (API) | Migrasi tulis penuh ke Supabase (forum/admin/moderasi/reports/reactions) + RPC admin + fix identitas login | Selesai | lint/tsc/build hijau 16/16; tulis terverifikasi end-to-end (session learner); deploy VPS menyusul |
| 2026-08-29 | Lane A/C/H/I (Fase A) | Wiring: Mentor Hub real (RPC booking/review/availability + migration profiles), AI tutor persist chat_history + GET, notifikasi realtime bridge + createNotificationRemote, nav Mentor/Peringkat (`90dbcd1`) | Selesai | build hijau, tsc 0 non-test, migration applied via pooler, live di VPS + smoke test |
| 2026-08-29 | Lane E/F/G (Fase B1) | Gamifikasi server-side (RPC get_leaderboard 3 periode + badge persist DB), Profile Enhancement (bio/expertise/badges/edit), Content Editor (MarkdownEditor + quiz dinamis, tanpa dep baru) (`991d42c`) | Selesai | build hijau, tsc 0 non-test, RPC leaderboard tested (top-3 real data), live di VPS |
| 2026-08-29 | Lane E/G/baru (Fase B2) | Project Gallery Pro (cover/demo + masonry + markdown), Admin Analytics (RPC stats guard is_admin + chart CSS), Growth (referral +25/+25, challenges + /challenges page, register referral) (`88d3e8c`) | Selesai | build hijau, tsc 0 non-test, 3 migration applied, 7/7 RPC + 2 challenge seed verified, live di VPS (9 routes 200) |
| 2026-08-29 | Lab / eksperimental (test1 → main) | Learning Lab: flag `/labs` + Jalur Belajar (mastery gate 80% + enrollment `path_enrollments` + bonus +50 via `claim_path_bonus` + badge pioneer/graduate) + Kartu Hafalan SRS SM-2 (`flashcard_progress`, 15 kartu seed) + widget dashboard | Sebagian | **Merged ke main (`e10f72a`, ff dari test1 `f9aad59`..`e10f72a`)** atas permintaan user; lint 0 error baru, tsc 0 non-test, build hijau 19/19, vitest 10/10 (pool threads), smoke test runtime 11 route 200 + konten verifikasi; fix RLS `user_id` upsert flashcard (`e10f72a`); 2 migration (20260902000001/2) **belum applied** — password pooler invalid (28P01), apply via SQL Editor atau `DATABASE_URL=... node .deploy-tools/apply-lab.mjs`; NAV site-header +1 "Jalur" (mohon review Lane A) |

Aturan:
- Satu baris per plan yang selesai. Jangan hapus baris agent lain.
- `Status` = `Selesai` / `Sebagian` / `Ditunda` — kalau `Sebagian`, tulis sisa di `Catatan`.
- Di `Catatan` cantumkan hasil verifikasi (`lint`, `tsc --noEmit`, `build`) + nomor PR/commit.
- Jika plan dibatalkan, tetap tulis baris dengan `Status: Dibatalkan` dan alasan singkat — jangan diam-diam hapus.

## Keputusan Struktur

- Tetap `src/components/*` (tunda refactor `components → features/*` sampai lane stabil).
- `state.interests` dan tutor mock masih perlu dihubungkan ke filter/rekomendasi (task eksplisit lane C).
- 9 remote branch divergen sudah diaudit; baseline `main` saat ini adalah hasil audit tersebut.
