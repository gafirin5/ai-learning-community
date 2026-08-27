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

- Slice terpisah: `src/lib/types/*`, `src/lib/data/*`, `src/lib/store/*` (shim `types.ts`/`data.ts`/`store.tsx` tetap ada).
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
| | | | | |

Aturan:
- Satu baris per plan yang selesai. Jangan hapus baris agent lain.
- `Status` = `Selesai` / `Sebagian` / `Ditunda` — kalau `Sebagian`, tulis sisa di `Catatan`.
- Di `Catatan` cantumkan hasil verifikasi (`lint`, `tsc --noEmit`, `build`) + nomor PR/commit.
- Jika plan dibatalkan, tetap tulis baris dengan `Status: Dibatalkan` dan alasan singkat — jangan diam-diam hapus.

## Keputusan Struktur

- Tetap `src/components/*` (tunda refactor `components → features/*` sampai lane stabil).
- `state.interests` dan tutor mock masih perlu dihubungkan ke filter/rekomendasi (task eksplisit lane C).
- 9 remote branch divergen sudah diaudit; baseline `main` saat ini adalah hasil audit tersebut.
