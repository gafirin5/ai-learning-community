-- ============================================================================
-- MENTOR PROFILES - kolom tambahan tabel profiles untuk Mentor Hub (Lane H)
-- Idempotent: aman dijalankan ulang.
-- Konteks: profiles(id uuid PK, name, email, role, joined_at, created_at)
-- sudah live; migration ini HANYA menambah kolom profil mentor + seed contoh.
-- ============================================================================

alter table public.profiles add column if not exists expertise text[] not null default '{}';
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists max_sessions_per_week integer default 10;

-- ---------------------------------------------------------------------------
-- Seed idempotent (email unik di profiles) — mentor contoh bahasa Indonesia.
-- Bila baris belum ada, UPDATE ini no-op (aman).
-- ---------------------------------------------------------------------------
update public.profiles
set expertise = array['Machine Learning','Python','Data Science']::text[],
    bio = 'Mentor machine learning dan data science. Terbiasa mendampingi pemula belajar Python, statistik, dan membangun proyek ML end-to-end.'
where email = 'budi@example.com';

update public.profiles
set expertise = array['Deep Learning','Computer Vision','NLP']::text[],
    bio = 'Mentor deep learning dengan fokus computer vision dan NLP. Senang membantu menyusun portofolio proyek AI yang solid.'
where email = 'sari@example.com';

notify pgrst, 'reload schema';
