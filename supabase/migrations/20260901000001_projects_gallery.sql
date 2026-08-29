-- Migration: Projects Gallery (Lane E) — kolom cover image + demo URL
-- untuk showcase proyek. Idempotent (aman dijalankan berulang).
--
-- Konsumen:
--   src/app/projects/page.tsx     (masonry gallery + cover + badge Demo + filter "Ada Demo")
--   src/app/projects/[id]/page.tsx (cover besar + tombol "Lihat Demo")
--   src/lib/api.ts                 (mapping projects: cover_image_url / demo_url)
--
-- Catatan: api-write.ts (addProjectRemote/updateProjectRemote) belum mengirim
-- kedua kolom ini — jalur tulis cover/demo ditangani store/projects.ts via
-- update by id setelah insert.

alter table public.projects
  add column if not exists cover_image_url text;
alter table public.projects
  add column if not exists demo_url text;

-- Reload schema PostgREST agar kolom baru langsung terbaca oleh API.
notify pgrst, 'reload schema';
