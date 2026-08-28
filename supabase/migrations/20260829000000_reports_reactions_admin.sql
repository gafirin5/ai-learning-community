-- Migration: reports + reactions + lapisan admin (RLS + RPC SECURITY DEFINER).
-- Melengkapi init (schema publik) dan write_layer (RPC learner-facing).

-- ============================================================
-- Helper: apakah user saat ini admin?
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Tabel reports (moderasi)
-- ============================================================
create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  target_type text not null check (target_type in ('thread','comment')),
  target_id   bigint not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  status      text not null default 'open' check (status in ('open','resolved')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_reports_target on public.reports(target_type, target_id);
create index if not exists idx_reports_status on public.reports(status);

alter table public.reports enable row level security;

drop policy if exists "reports insert self" on public.reports;
create policy "reports insert self" on public.reports
  for insert with check (reporter_id = auth.uid());
drop policy if exists "reports select own-or-admin" on public.reports;
create policy "reports select own-or-admin" on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());
drop policy if exists "reports update admin" on public.reports;
create policy "reports update admin" on public.reports
  for update using (public.is_admin());
drop policy if exists "reports delete admin" on public.reports;
create policy "reports delete admin" on public.reports
  for delete using (public.is_admin());

-- ============================================================
-- Tabel reactions (satu reaksi per user per target)
-- ============================================================
create table if not exists public.reactions (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  target_type  text not null check (target_type in ('thread','comment')),
  target_id    bigint not null,
  reaction_key text not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create index if not exists idx_reactions_target on public.reactions(target_type, target_id);

alter table public.reactions enable row level security;

drop policy if exists "reactions owner" on public.reactions;
create policy "reactions owner" on public.reactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- Kebijakan admin untuk konten (courses/lessons/quizzes)
-- ============================================================
drop policy if exists "courses insert admin" on public.courses;
create policy "courses insert admin" on public.courses
  for insert with check (public.is_admin());
drop policy if exists "courses update admin" on public.courses;
create policy "courses update admin" on public.courses
  for update using (public.is_admin());
drop policy if exists "courses delete admin" on public.courses;
create policy "courses delete admin" on public.courses
  for delete using (public.is_admin());

drop policy if exists "lessons insert admin" on public.lessons;
create policy "lessons insert admin" on public.lessons
  for insert with check (public.is_admin());
drop policy if exists "lessons update admin" on public.lessons;
create policy "lessons update admin" on public.lessons
  for update using (public.is_admin());
drop policy if exists "lessons delete admin" on public.lessons;
create policy "lessons delete admin" on public.lessons
  for delete using (public.is_admin());

drop policy if exists "quizzes insert admin" on public.quizzes;
create policy "quizzes insert admin" on public.quizzes
  for insert with check (public.is_admin());
drop policy if exists "quizzes update admin" on public.quizzes;
create policy "quizzes update admin" on public.quizzes
  for update using (public.is_admin());
drop policy if exists "quizzes delete admin" on public.quizzes;
create policy "quizzes delete admin" on public.quizzes
  for delete using (public.is_admin());

-- ============================================================
-- Moderasi: admin boleh mengubah/menghapus konten siapa pun
-- (drop policy lama, buat ulang owner-or-admin)
-- ============================================================
drop policy if exists "threads update self" on public.threads;
drop policy if exists "threads update owner-or-admin" on public.threads;
create policy "threads update owner-or-admin" on public.threads
  for update using (user_id = auth.uid() or public.is_admin());
drop policy if exists "threads delete self" on public.threads;
drop policy if exists "threads delete owner-or-admin" on public.threads;
create policy "threads delete owner-or-admin" on public.threads
  for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists "comments update self" on public.comments;
drop policy if exists "comments update owner-or-admin" on public.comments;
create policy "comments update owner-or-admin" on public.comments
  for update using (user_id = auth.uid() or public.is_admin());
drop policy if exists "comments delete self" on public.comments;
drop policy if exists "comments delete owner-or-admin" on public.comments;
create policy "comments delete owner-or-admin" on public.comments
  for delete using (user_id = auth.uid() or public.is_admin());

-- Penulis tetap melihat konten hidden miliknya; admin melihat semua.
drop policy if exists "threads select visible" on public.threads;
drop policy if exists "threads select visible-or-own" on public.threads;
create policy "threads select visible-or-own" on public.threads
  for select using (hidden = false or user_id = auth.uid() or public.is_admin());
drop policy if exists "comments select visible" on public.comments;
drop policy if exists "comments select visible-or-own" on public.comments;
create policy "comments select visible-or-own" on public.comments
  for select using (hidden = false or user_id = auth.uid() or public.is_admin());

drop policy if exists "projects update self" on public.projects;
drop policy if exists "projects update owner-or-admin" on public.projects;
create policy "projects update owner-or-admin" on public.projects
  for update using (user_id = auth.uid() or public.is_admin());
drop policy if exists "projects delete self" on public.projects;
drop policy if exists "projects delete owner-or-admin" on public.projects;
create policy "projects delete owner-or-admin" on public.projects
  for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists "project_comments owner" on public.project_comments;
drop policy if exists "project_comments insert self" on public.project_comments;
create policy "project_comments insert self" on public.project_comments
  for insert with check (user_id = auth.uid());
drop policy if exists "project_comments delete owner-or-admin" on public.project_comments;
drop policy if exists "project_comments delete owner-or-admin" on public.project_comments;
create policy "project_comments delete owner-or-admin" on public.project_comments
  for delete using (user_id = auth.uid() or public.is_admin());

-- Admin boleh mengubah profil siapa pun (role); pemilik tetap bisa edit miliknya.
drop policy if exists "profiles update self" on public.profiles;
drop policy if exists "profiles update owner-or-admin" on public.profiles;
create policy "profiles update owner-or-admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- ============================================================
-- RPC admin: kelola user (auth.users) — hanya untuk admin
-- ============================================================

-- Buat user baru (terkonfirmasi). Password opsional: null → dibuat acak.
-- Mengembalikan id, email, dan password efektif (untuk dibagikan ke user).
drop function if exists public.admin_create_user(text, text, text, text);
create or replace function public.admin_create_user(p_email text, p_password text, p_name text, p_role text)
returns table (out_id uuid, out_email text, out_password text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid;
  v_email text := lower(trim(p_email));
  v_password text := p_password;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh membuat user';
  end if;
  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'Email tidak valid';
  end if;
  if p_role not in ('learner','mentor','admin') then
    raise exception 'Role tidak valid';
  end if;
  if v_password is null or v_password = '' then
    v_password := 'aic-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);
  end if;
  if length(v_password) < 6 then
    raise exception 'Kata sandi minimal 6 karakter';
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Email sudah terdaftar';
  end if;

  v_uid := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    phone_change_token, reauthentication_token,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
    crypt(v_password, gen_salt('bf', 10)), now(),
    '', '',
    '', '', '',
    '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'name', p_name, 'role', p_role, 'email', v_email,
      'email_verified', true, 'phone_verified', false, 'sub', v_uid::text
    ),
    now(), now(), false, false
  );

  -- Kolom email di auth.identities adalah GENERATED — jangan di-insert.
  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_uid, v_uid::text, 'email',
    jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    now(), now(), now()
  );

  insert into public.user_stats (user_id, points, streak) values (v_uid, 0, 0)
  on conflict (user_id) do nothing;

  return query select v_uid, v_email, v_password;
end;
$$;

-- Ubah role user. Sinkronkan juga metadata auth agar login berikutnya konsisten.
create or replace function public.admin_set_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_count integer;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh mengubah role';
  end if;
  if p_role not in ('learner','mentor','admin') then
    raise exception 'Role tidak valid';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User tidak ditemukan';
  end if;
  if p_user_id = auth.uid() and p_role <> 'admin' then
    raise exception 'Tidak bisa menurunkan role sendiri';
  end if;
  if p_role <> 'admin' then
    select count(*) into v_admin_count from public.profiles where role = 'admin';
    if v_admin_count <= 1 and exists (select 1 from public.profiles where id = p_user_id and role = 'admin') then
      raise exception 'Tidak bisa menurunkan admin terakhir';
    end if;
  end if;

  update public.profiles set role = p_role where id = p_user_id;
  update auth.users
    set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', p_role)
    where id = p_user_id;
end;
$$;

-- Hapus user (cascade ke profiles → konten). Tolak self-delete & admin terakhir.
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh menghapus user';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Tidak bisa menghapus diri sendiri';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User tidak ditemukan';
  end if;
  if exists (select 1 from public.profiles where id = p_user_id and role = 'admin') then
    if (select count(*) from public.profiles where role = 'admin') <= 1 then
      raise exception 'Tidak bisa menghapus admin terakhir';
    end if;
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

-- Hanya user ter-autentikasi yang boleh memanggil RPC admin.
revoke execute on function public.admin_create_user(text, text, text, text) from anon, public;
revoke execute on function public.admin_set_role(uuid, text) from anon, public;
revoke execute on function public.admin_delete_user(uuid) from anon, public;
grant execute on function public.admin_create_user(text, text, text, text) to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
