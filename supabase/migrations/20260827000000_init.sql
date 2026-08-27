-- AI Learning Community — schema + RLS + seed
-- Supabase full BaaS. Auth pakai auth.users bawaan Supabase (bukan tabel users manual).

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Profiles (1:1 dengan auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null default 'learner' check (role in ('learner','mentor','admin')),
  joined_at   date not null default current_date,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Courses / lessons / quizzes
-- ============================================================
create table if not exists public.courses (
  id          bigint generated always as identity primary key,
  mentor_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  slug        text not null unique,
  description text not null default '',
  level       text not null default 'pemula' check (level in ('pemula','menengah','lanjutan')),
  topics      text[] not null default '{}',
  created_at  date not null default current_date
);

create table if not exists public.lessons (
  id        bigint generated always as identity primary key,
  course_id bigint not null references public.courses(id) on delete cascade,
  title     text not null,
  summary   text not null default '',
  content   text not null default '',
  "order"   integer not null default 0
);

create table if not exists public.quizzes (
  id        bigint generated always as identity primary key,
  lesson_id bigint not null references public.lessons(id) on delete cascade,
  title     text not null default '',
  questions jsonb not null default '[]'::jsonb
);

-- ============================================================
-- Progress / bookmarks / interests / certificates / badges
-- ============================================================
create table if not exists public.progress (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  lesson_id  bigint not null references public.lessons(id) on delete cascade,
  status     text not null default 'belum' check (status in ('belum','selesai')),
  quiz_score integer,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.bookmarks (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  course_id bigint not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic   text not null,
  primary key (user_id, topic)
);

create table if not exists public.certificates (
  id           text primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  course_id    bigint not null references public.courses(id) on delete cascade,
  course_title text not null,
  issued_at    timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.badges (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- Poin & streak per user (untuk leaderboard lintas user).
create table if not exists public.user_stats (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  points      integer not null default 0,
  streak      integer not null default 0,
  last_active date
);

-- ============================================================
-- Forum
-- ============================================================
create table if not exists public.threads (
  id                  bigint generated always as identity primary key,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  title               text not null,
  body                text not null default '',
  tags                text[] not null default '{}',
  vote_count          integer not null default 0,
  view_count          integer not null default 0,
  accepted_comment_id bigint,
  created_at          timestamptz not null default now(),
  category_id         text not null default 'umum',
  pinned              boolean not null default false,
  hidden              boolean not null default false,
  images              jsonb not null default '[]'::jsonb
);

create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  thread_id  bigint not null references public.threads(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  parent_id  bigint references public.comments(id) on delete cascade,
  body       text not null,
  vote_count integer not null default 0,
  created_at timestamptz not null default now(),
  hidden     boolean not null default false,
  images     jsonb not null default '[]'::jsonb
);

create table if not exists public.thread_saves (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  thread_id bigint not null references public.threads(id) on delete cascade,
  primary key (user_id, thread_id)
);

create table if not exists public.thread_votes (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  thread_id bigint not null references public.threads(id) on delete cascade,
  value     integer not null check (value in (-1, 0, 1)),
  primary key (user_id, thread_id)
);

create table if not exists public.comment_votes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  comment_id bigint not null references public.comments(id) on delete cascade,
  value      integer not null check (value in (-1, 0, 1)),
  primary key (user_id, comment_id)
);

-- ============================================================
-- Projects
-- ============================================================
create table if not exists public.projects (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text not null default '',
  repo_url    text not null default '',
  tags        text[] not null default '{}',
  level       text not null default 'pemula' check (level in ('pemula','menengah','lanjutan')),
  created_at  timestamptz not null default now(),
  like_count  integer not null default 0
);

create table if not exists public.project_comments (
  id         bigint generated always as identity primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_votes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  value      integer not null check (value in (-1, 0, 1)),
  primary key (user_id, project_id)
);

-- ============================================================
-- Notifications
-- ============================================================
create table if not exists public.notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null default 'system',
  title      text not null,
  body       text not null default '',
  href       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_progress_user on public.progress(user_id);
create index if not exists idx_threads_user on public.threads(user_id);
create index if not exists idx_comments_thread on public.comments(thread_id);
create index if not exists idx_comments_user on public.comments(user_id);
create index if not exists idx_projects_user on public.projects(user_id);
create index if not exists idx_notifications_user on public.notifications(user_id, read);
create index if not exists idx_lessons_course on public.lessons(course_id);
create index if not exists idx_quizzes_lesson on public.quizzes(lesson_id);

-- ============================================================
-- Helper: profil otomatis dibuat saat user daftar (trigger)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'role', 'learner')
  )
  on conflict (id) do nothing;

  insert into public.user_stats (user_id, points, streak)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.quizzes enable row level security;
alter table public.progress enable row level security;
alter table public.bookmarks enable row level security;
alter table public.interests enable row level security;
alter table public.certificates enable row level security;
alter table public.badges enable row level security;
alter table public.user_stats enable row level security;
alter table public.threads enable row level security;
alter table public.comments enable row level security;
alter table public.thread_saves enable row level security;
alter table public.thread_votes enable row level security;
alter table public.comment_votes enable row level security;
alter table public.projects enable row level security;
alter table public.project_comments enable row level security;
alter table public.project_votes enable row level security;
alter table public.notifications enable row level security;

-- Konten publik (bisa dibaca semua user ter-autentikasi; anon juga boleh baca konten).
create policy "profiles select" on public.profiles for select using (true);
create policy "courses select" on public.courses for select using (true);
create policy "lessons select" on public.lessons for select using (true);
create policy "quizzes select" on public.quizzes for select using (true);
create policy "threads select visible" on public.threads for select using (hidden = false);
create policy "comments select visible" on public.comments for select using (hidden = false);
create policy "projects select" on public.projects for select using (true);
create policy "project_comments select" on public.project_comments for select using (true);

-- Insert/update: hanya pemilik (auth.uid()).
create policy "profiles insert self" on public.profiles for insert with check (id = auth.uid());
create policy "profiles update self" on public.profiles for update using (id = auth.uid());

create policy "progress owner" on public.progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "bookmarks owner" on public.bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "interests owner" on public.interests for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "certificates owner" on public.certificates for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "badges owner" on public.badges for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user_stats owner" on public.user_stats for select using (user_id = auth.uid());

create policy "threads insert self" on public.threads for insert with check (user_id = auth.uid());
create policy "threads update self" on public.threads for update using (user_id = auth.uid());
create policy "threads delete self" on public.threads for delete using (user_id = auth.uid());
create policy "comments insert self" on public.comments for insert with check (user_id = auth.uid());
create policy "comments update self" on public.comments for update using (user_id = auth.uid());
create policy "comments delete self" on public.comments for delete using (user_id = auth.uid());

create policy "thread_saves owner" on public.thread_saves for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "thread_votes owner" on public.thread_votes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "comment_votes owner" on public.comment_votes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "projects insert self" on public.projects for insert with check (user_id = auth.uid());
create policy "projects update self" on public.projects for update using (user_id = auth.uid());
create policy "projects delete self" on public.projects for delete using (user_id = auth.uid());
create policy "project_comments owner" on public.project_comments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "project_votes owner" on public.project_votes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "notifications owner" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- Seed data (idempotent — hanya jalan kalau tabel courses masih kosong)
-- ============================================================
do $$
declare
  mentor1 uuid;
  mentor2 uuid;
  learner3 uuid;
  learner4 uuid;
  learner5 uuid;
  admin6 uuid;
begin
  if exists (select 1 from public.courses limit 1) then
    return;
  end if;

  -- Buat user seed via auth.users + profiles (id stabil via gen_random_uuid dicatat ke variabel).
  -- Catatan: password auth.users diisi hash bcrypt placeholder; login seed user via Supabase Auth
  -- tetap butuh signup manual. Untuk demo frontend bisa pakai sign-up baru.
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, encrypted_password, aud, role)
  values
    (gen_random_uuid(), 'budi@example.com', now(), '{"name":"Budi Santoso","role":"mentor"}', '{"provider":"email","providers":["email"]}', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated')
  returning id into mentor1;

  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, encrypted_password, aud, role)
  values
    (gen_random_uuid(), 'sari@example.com', now(), '{"name":"Sari Wijaya","role":"mentor"}', '{"provider":"email","providers":["email"]}', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated')
  returning id into mentor2;

  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, encrypted_password, aud, role)
  values
    (gen_random_uuid(), 'rina@example.com', now(), '{"name":"Rina Putri","role":"learner"}', '{"provider":"email","providers":["email"]}', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated')
  returning id into learner3;

  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, encrypted_password, aud, role)
  values
    (gen_random_uuid(), 'andi@example.com', now(), '{"name":"Andi Saputra","role":"learner"}', '{"provider":"email","providers":["email"]}', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated')
  returning id into learner4;

  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, encrypted_password, aud, role)
  values
    (gen_random_uuid(), 'dewi@example.com', now(), '{"name":"Dewi Lestari","role":"learner"}', '{"provider":"email","providers":["email"]}', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated')
  returning id into learner5;

  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, encrypted_password, aud, role)
  values
    (gen_random_uuid(), 'admin@example.com', now(), '{"name":"Admin Pusat","role":"admin"}', '{"provider":"email","providers":["email"]}', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated')
  returning id into admin6;

  -- Trigger handle_new_user() sudah membuat profiles + user_stats.
  -- Sesuaikan role (meta role sudah ditulis trigger, tapi pastikan).
  update public.profiles set role = 'mentor' where email = 'budi@example.com';
  update public.profiles set role = 'mentor' where email = 'sari@example.com';
  update public.profiles set role = 'learner' where email in ('rina@example.com','andi@example.com','dewi@example.com');
  update public.profiles set role = 'admin' where email = 'admin@example.com';

  -- Courses
  insert into public.courses (mentor_id, title, slug, description, level, topics, created_at) values
    (mentor1, 'Pengantar Machine Learning', 'pengantar-machine-learning', 'Kenali konsep dasar machine learning dari nol.', 'pemula', array['machine-learning','dasar','regresi'], '2026-03-01'),
    (mentor1, 'Python untuk Data Science', 'python-untuk-data-science', 'Siapkan lingkungan Python dan kuasai NumPy, Pandas, scikit-learn.', 'pemula', array['python','pandas','scikit-learn'], '2026-03-15'),
    (mentor2, 'Deep Learning: Dasar & Intuisi', 'deep-learning-dasar', 'Pahami jaringan saraf, backpropagation, dan overfitting.', 'menengah', array['deep-learning','neural-network','overfitting'], '2026-04-02');

  -- Lessons
  insert into public.lessons (course_id, title, summary, content, "order") values
    ((select id from public.courses where slug='pengantar-machine-learning'), 'Apa itu Machine Learning?', 'Definisi ML dan perbedaannya dengan pemrograman tradisional.', '## Definisi\nMachine learning adalah cabang AI yang belajar dari data.', 1),
    ((select id from public.courses where slug='pengantar-machine-learning'), 'Data, Fitur, dan Label', 'Dataset, fitur, dan label.', '## Dataset\nTabel dengan baris sampel dan kolom fitur.', 2),
    ((select id from public.courses where slug='pengantar-machine-learning'), 'Model Pertama: Regresi Linear', 'Regresi linear sebagai model paling sederhana.', '## Regresi Linear\ny = w·x + b', 3),
    ((select id from public.courses where slug='python-untuk-data-science'), 'Setup Python & Library Dasar', 'NumPy dan Pandas.', '## Setup\npip install numpy pandas scikit-learn', 1),
    ((select id from public.courses where slug='python-untuk-data-science'), 'Klasifikasi dengan scikit-learn', 'Model klasifikasi pertama.', '## Klasifikasi\nDecisionTreeClassifier', 2),
    ((select id from public.courses where slug='deep-learning-dasar'), 'Jaringan Saraf & Backpropagation', 'Neuron, forward pass, backpropagation.', '## Jaringan Saraf\nNeuron + aktivasi non-linear.', 1),
    ((select id from public.courses where slug='deep-learning-dasar'), 'Mengapa Model Overfitting?', 'Overfitting dan pencegahannya.', '## Overfitting\nModel menghafal noise.', 2);

  -- Threads
  insert into public.threads (user_id, title, body, tags, vote_count, view_count, created_at, category_id, pinned) values
    (learner3, 'Bingung bedanya supervised dan unsupervised', 'Saya baru mulai belajar dan masih bingung.', array['machine-learning','dasar'], 12, 120, now() - interval '17 days', 'ml', false),
    (learner4, 'Rekomendasi dataset publik untuk klasifikasi', 'Dataset apa yang menarik untuk pemula?', array['dataset','klasifikasi'], 9, 84, now() - interval '15 days', 'data', false),
    (learner5, 'Learning rate terlalu besar tidak konvergen', 'Loss naik turun liar.', array['deep-learning','optimizer'], 6, 63, now() - interval '12 days', 'dl', false),
    (mentor2, 'Tips menulis penjelasan model untuk non-teknis', 'Sebagai mentor, butuh tips storytelling.', array['komunikasi','mentor'], 15, 210, now() - interval '11 days', 'career', true);

  -- Projects
  insert into public.projects (user_id, title, description, repo_url, tags, level, like_count) values
    (learner4, 'Klasifikasi Sentimen Ulasan Aplikasi', 'TF-IDF + Logistic Regression, akurasi 87%.', 'https://github.com/example/sentimen-ulasan', array['nlp','klasifikasi','python'], 'pemula', 18),
    (learner3, 'Prediksi Harga Rumah Jakarta', 'Regresi harga rumah berdasarkan luas dan lokasi.', 'https://github.com/example/harga-rumah-jkt', array['regresi','pandas'], 'pemula', 12),
    (learner5, 'Klasifikasi Gambar Daun dengan CNN', 'CNN untuk 10 jenis daun, akurasi 91%.', 'https://github.com/example/cnn-daun', array['deep-learning','computer-vision'], 'menengah', 26);
end $$;
