# AGENTS.md — ⚙️ Backend / REST API (`apps/api`)

> Scope spesifik untuk domain **Backend API**. Mewarisi semua Aturan Utama dari root [`AGENTS.md`](../../AGENTS.md). Jika ada konflik, file ini menang tapi tidak boleh melonggarkan aturan `main` protected.

## Status Saat Ini — PLACEHOLDER

Repo ini **masih murni frontend-only**. Belum ada `apps/api/src`, belum ada database, dan persistensi masih `localStorage` key `aic-store-v1` di `src/lib/store/persistence.ts`. File ini adalah **kontrak ke depan** agar hierarki `my-project/apps/api` sudah terisi sebelum implementasi.

**Jangan** membuat `apps/api/package.json`, `next.config.mjs`, atau koneksi DB sebelum keputusan stack API disepakati (Next.js Route Handlers vs service terpisah, pilihan DB/auth).

## Future Scope (saat API diaktifkan)

- Pengganti `localStorage` → API + DB. Migrasi seeds dari `src/lib/data/*` (`users.ts`, `courses.ts`, `forum.ts`, `projects.ts`, `interests.ts`) dan `initialState` di `src/lib/tutor.ts` menjadi sumber data API.
- Migrasi actions di `src/lib/store/*` (`auth.ts`, `progress.ts`, `chat.ts`, `forum.ts`, `projects.ts`, `admin.ts`) — yang kini `useCallback + setState` langsung — menjadi fetch ke `apps/api`.
- Struktur yang disiapkan: `apps/api/src/routes/*` (atau `apps/api/app/api/*` jika Route Handlers), `apps/api/src/lib/validation/*`, `apps/api/src/lib/auth/*`.

## Kepemilikan Lane (future)

Belum ada lane yang ter-assign ke `apps/api`. Saat diaktifkan, reserve lane baru (mis. **I. API & Persistence**) agar tidak bentrok dengan lane `apps/web` (B–H) dan `packages/ui` (A). Koordinasi via gatekeeper Lane A sebelum menyentuh `src/lib/store/persistence.ts` dan `src/lib/types/store.ts` yang dibaca kedua sisi.

## Konvensi yang Disiapkan

- Validasi input di boundary API (schema), bukan di komponen.
- Auth boundary jelas — `apps/api` tidak mengimpor komponen dari `packages/ui` atau `apps/web`.
- Perubahan kontrak tipe (`src/lib/types/*` → future `packages/types` atau `packages/ui`) harus sinkron dengan `apps/web` via PR yang mereferensikan kedua `AGENTS.md`.

## Yang Tidak Boleh Dilakukan di Scope Ini

- Jangan menyentuh `src/components/*` atau `packages/ui` dari `apps/api`.
- Jangan mengubah `src/lib/store/persistence.ts` menjadi fetch tanpa migrasi `StoreState` yang disepakati.
- Jangan menambahkan dependency monorepo (`pnpm-workspace.yaml`, `turbo.json`, `workspaces`) hanya untuk mengisi `apps/api` — itu bagian dari PR migrasi penuh.
