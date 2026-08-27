# AGENTS.md — 🎨 Frontend / Web App (`apps/web`)

> Scope spesifik untuk domain **Web App**. Mewarisi semua Aturan Utama dari root [`AGENTS.md`](../../AGENTS.md). Jika ada konflik, file ini (yang lebih spesifik) menang, tapi tidak boleh melonggarkan aturan `main` protected.

## Stack & Karakter

- **Next.js 14 App Router + React 18 + Tailwind** — murni frontend-only.
- State global di `src/lib/store` (persist `localStorage` key `aic-store-v1`).
- Styling via design tokens CSS vars (`--bg`, `--surface`, dst) yang didefinisikan di `globals.css` + `tailwind.config.ts` (saat ini di root, future di `packages/ui`).

## Scope Direktori (ownership logis)

> **Catatan migrasi:** Kode fisik **masih di `src/` di root** (belum dipindah ke `apps/web/src`). File ini mendefinisikan ownership logis agar siap saat migrasi monorepo. Jangan pindahkan file tanpa PR migrasi terpisah.

- `src/app/*` — routing App Router (`courses`, `forum`, `projects`, `dashboard`, `profile`, `admin`, `login`, `register`, `onboarding`)
- `src/components/*` — semua komponen kecuali yang dimiliki `packages/ui` (lihat `packages/ui/AGENTS.md`)
- `src/lib/store/*` — slice store (`context.ts`, `persistence.ts`, `auth.ts`, `progress.ts`, `chat.ts`, `forum.ts`, `projects.ts`, `admin.ts`, `index.tsx`)
- `src/lib/data/*` — seeds & data mock (`users.ts`, `courses.ts`, `forum.ts`, `projects.ts`, `interests.ts`)
- `src/lib/types/*` — tipe domain (`common.ts`, `user.ts`, `course.ts`, `forum.ts`, `project.ts`, `progress.ts`, `store.ts`)
- `src/lib/tutor.ts` — mock tutor & quota chat

## Kepemilikan Lane (detail untuk `apps/web`)

| Lane | Direktori/file yang dimiliki | Catatan |
|------|------------------------------|---------|
| **B. Auth & Onboarding** | `src/app/login/*`, `register/*`, `onboarding/*`, `src/lib/store/auth.ts` | Hanya sentuh `auth` slice |
| **C. Courses & Learning** | `src/app/courses/*`, `quiz-panel.tsx`, `tutor-chat.tsx`, `table-of-contents.tsx`, `progress.tsx`, `src/lib/store/progress.ts`, `chat.ts`, `src/lib/tutor.ts`, `src/lib/data/courses.ts` | Butuh `store/progress` & `chat`, terisolasi dari forum/projects |
| **D. Forum** | `src/app/forum/*`, `vote-control.tsx`, `reactions.tsx`, `markdown-lite.tsx`, `src/lib/store/forum.ts`, `src/lib/data/forum.ts` | Terbesar (708L di `forum/page.tsx`) |
| **E. Projects & Showcase** | `src/app/projects/*`, `src/components/admin/projects.tsx`, `src/lib/store/projects.ts`, `src/lib/data/projects.ts` | Fase 4: `LiveDemo.tsx`, `PeerReview.tsx` |
| **F. Dashboard & Profile** | `src/app/dashboard/*`, `profile/[id]/*`, `avatar.tsx`, `count-up.tsx` | Butuh progress/bookmarks slice |
| **G. Admin** | `src/app/admin/*`, `src/components/admin/*` (6 file), `src/lib/store/admin.ts` | Tiap sub-file bisa di-own terpisah |
| **H. Mentor Hub (Fase 5)** | `src/app/mentor/*`, `src/components/mentor/*` (future) | Saat migrasi → `apps/web/app/mentor/*`, saat ini di branch `feat/mentor-hub` |

Lane **A. Shell & Design System** (gatekeeper) berbagi antara `apps/web` (`site-header.tsx`, `providers.tsx`, `layout.tsx`) dan `packages/ui` (komponen pure). Perubahan file global tetap via PR kecil gatekeeper Lane A.

## Aturan Slice (khusus `apps/web`)

- `src/lib/store/*` sudah ter-slice per domain; shim `src/lib/store.tsx` tetap ada untuk kompatibilitas — **kode baru impor dari slice, bukan dari shim** (idem untuk `src/lib/types/*` dan `src/lib/data/*`).
- **Aturan emas:** Jangan edit `src/lib/store/<slice milik lane lain>` tanpa koordinasi.
- `StoreState` (`src/lib/types/store.ts`) masih monolit — setiap slice dapat `StateSetter` ke seluruh state. Jangan mengandalkan isolasi tipe untuk keamanan lane.

## Konvensi

- Path alias `@/*` → `./src/*` (masih di root; future `apps/web/src/*` + `@repo/ui`).
- `tailwind.config.ts` content saat ini `src/app/**/*` + `src/components/**/*`; future `apps/web/**/*` + `packages/ui/**/*` + `transpilePackages: ["@repo/ui"]` di `next.config.mjs`.
- Verifikasi sebelum PR: `npm run lint && npx tsc --noEmit && npm run build` harus hijau (CI juga cek ini).

## Yang Tidak Boleh Dilakukan di Scope Ini

- Jangan import langsung dari `packages/ui` yang belum ada sebagai package — sampai migrasi, komponen UI masih di `src/components/*`.
- Jangan buat `apps/api` logic di sini; persistensi tetap `localStorage` sampai `apps/api` siap.
