# AGENTS.md — 🧱 Shared UI Component Library (`packages/ui`)

> Scope spesifik untuk **Shared UI**. Mewarisi semua Aturan Utama dari root [`AGENTS.md`](../../AGENTS.md). Jika ada konflik, file ini menang tapi tidak boleh melonggarkan aturan `main` protected.

## Pemilik

**Lane A. Shell & Design System (gatekeeper)** — semua perubahan di scope ini via PR kecil yang di-review gatekeeper. Lane lain jangan edit file di sini tanpa mention di PR.

## Scope Direktori (ownership logis)

> **Catatan migrasi:** Kode fisik **masih di `src/` di root** (belum dipindah ke `packages/ui/src`). File ini mendefinisikan ownership logis agar siap saat migrasi monorepo.

**Kandidat pasti `packages/ui`** (pure presentational, tanpa `useStore`):

- `src/components/ui.tsx` — `LevelBadge`, `Tag`, `EmptyState` (hanya `LEVEL_BADGE`/`LEVEL_LABEL` + tipe `Level`)
- `src/components/toast.tsx` — `ToastProvider` / `useToast` (self-contained, 3 kinds)
- `src/components/skeleton.tsx` — `Skeleton` / `CardSkeleton` / `ListSkeleton`
- `src/components/breadcrumbs.tsx` — `Breadcrumbs` (`next/link` only)
- `src/components/avatar.tsx`, `count-up.tsx`, `confetti.tsx`, `reveal.tsx`, `progress.tsx`
- `src/components/code-block.tsx`, `markdown-lite.tsx`, `theme-toggle.tsx`
- `src/lib/theme.tsx` + `src/app/globals.css` + `tailwind.config.ts` — design tokens (`bg`, `surface`, `brand`, `success` → `var(--bg)` dst)

**Tetap di `apps/web` (app-coupled, jangan pindah ke `packages/ui`):**

- `src/components/site-header.tsx` — baca `useStore().nextLesson` / `currentUser` / `logout`, `GlobalSearch` → harus menerima props jika suatu saat di-share.
- `src/components/providers.tsx` — komposisi `ThemeProvider + StoreProvider + ToastProvider` (future: `ThemeProvider + ToastProvider` → `packages/ui`, `StoreProvider` → `apps/web`).
- `src/components/global-search.tsx`, `image-upload.tsx`, `vote-control.tsx`, `reactions.tsx`, `quiz-panel.tsx`, `tutor-chat.tsx`, `table-of-contents.tsx` — domain-specific.

**Future candidates bila `packages/types` dibuat:** `src/lib/types/*` (`common.ts`, `user.ts`, `course.ts`, `forum.ts`, `project.ts`, `progress.ts`, `store.ts`).

## Aturan

- Komponen di `packages/ui` **props-based, tanpa `useStore` atau `localStorage`**. Butuh data → terima via props dari `apps/web`.
- Tidak ada akses `src/lib/store/*` atau `src/lib/data/*` langsung.
- Styling via tokens CSS vars + Tailwind; jangan hardcode warna — pakai token `bg/surface/brand/success`.

## Konvensi

- Sampai migrasi: impor masih `@/components/ui` dari `src/`. Future: `@repo/ui` dengan `transpilePackages: ["@repo/ui"]` di `apps/web/next.config.mjs` dan `tailwind.config.ts` content `["./apps/web/**/*", "./packages/ui/**/*"]`.
- Perubahan token (`globals.css`, `tailwind.config.ts`, `src/lib/theme.tsx`) tetap kategori **file global** — wajib PR gatekeeper meski logisnya milik `packages/ui`.

## Yang Tidak Boleh Dilakukan di Scope Ini

- Jangan memindahkan `site-header.tsx` atau `providers.tsx` ke `packages/ui` tanpa refactor props/store terlebih dahulu.
- Jangan menambahkan dependency workspace (`package.json` workspaces) hanya untuk mengisi `packages/ui` — itu bagian dari PR migrasi penuh.
