-- Migration: Learning Lab — Jalur Belajar (path_enrollments + RPC).
-- Melengkapi growth.sql (pola RPC SECURITY DEFINER + insert notifications
-- langsung dari dalam RPC — definer melewati RLS notifications).
-- Path sendiri (definisi jalur) tetap di kode frontend; tabel ini hanya
-- menyimpan enrollment & progres antar kursus per user.

-- ============================================================
-- 1. Tabel path_enrollments (owner-only)
-- ============================================================
create table if not exists public.path_enrollments (
  user_id           uuid not null references public.profiles(id) on delete cascade,
  path_slug         text not null,
  completed_courses text[] not null default '{}',
  bonus_awarded     boolean not null default false,
  enrolled_at       timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (user_id, path_slug)
);

create index if not exists idx_path_enrollments_user
  on public.path_enrollments(user_id);

alter table public.path_enrollments enable row level security;

drop policy if exists "path_enrollments select self" on public.path_enrollments;
create policy "path_enrollments select self" on public.path_enrollments
  for select using (user_id = auth.uid());
drop policy if exists "path_enrollments insert self" on public.path_enrollments;
create policy "path_enrollments insert self" on public.path_enrollments
  for insert with check (user_id = auth.uid());
drop policy if exists "path_enrollments update self" on public.path_enrollments;
create policy "path_enrollments update self" on public.path_enrollments
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "path_enrollments delete self" on public.path_enrollments;
create policy "path_enrollments delete self" on public.path_enrollments
  for delete using (user_id = auth.uid());

-- ============================================================
-- 2. RPC: ikuti jalur (idempoten) + notifikasi sambutan
-- ============================================================
drop function if exists public.enroll_path(text, text);
create or replace function public.enroll_path(p_slug text, p_title text default '')
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_slug  text := lower(btrim(coalesce(p_slug, '')));
  v_title text := coalesce(nullif(btrim(p_title), ''), v_slug);
  v_new   boolean := false;
begin
  if v_uid is null then
    raise exception 'Login diperlukan';
  end if;
  if v_slug = '' then
    raise exception 'Slug jalur wajib diisi';
  end if;

  insert into public.path_enrollments (user_id, path_slug)
  values (v_uid, v_slug)
  on conflict (user_id, path_slug) do nothing
  returning true into v_new;

  if v_new then
    insert into public.notifications (user_id, type, title, body, href)
    values (
      v_uid,
      'system',
      'Jalur belajar dimulai!',
      'Kamu resmi mengikuti jalur "' || v_title || '". Selesaikan kursus satu per satu untuk membuka rute berikutnya.',
      '/paths/' || v_slug
    );
  end if;

  return true;
end;
$$;
revoke execute on function public.enroll_path(text, text) from anon, public;
grant execute on function public.enroll_path(text, text) to authenticated;

-- ============================================================
-- 3. RPC: tinggalkan jalur
-- ============================================================
drop function if exists public.unenroll_path(text);
create or replace function public.unenroll_path(p_slug text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_slug text := lower(btrim(coalesce(p_slug, '')));
begin
  if v_uid is null then
    raise exception 'Login diperlukan';
  end if;

  delete from public.path_enrollments
    where user_id = v_uid and path_slug = v_slug;
  return true;
end;
$$;
revoke execute on function public.unenroll_path(text) from anon, public;
grant execute on function public.unenroll_path(text) to authenticated;

-- ============================================================
-- 4. RPC: tandai kursus dalam jalur selesai (idempoten, append slug)
-- ============================================================
drop function if exists public.mark_path_course_done(text, text);
create or replace function public.mark_path_course_done(p_slug text, p_course_slug text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid         uuid := auth.uid();
  v_slug        text := lower(btrim(coalesce(p_slug, '')));
  v_course_slug text := lower(btrim(coalesce(p_course_slug, '')));
begin
  if v_uid is null then
    raise exception 'Login diperlukan';
  end if;
  if v_slug = '' or v_course_slug = '' then
    raise exception 'Slug jalur dan kursus wajib diisi';
  end if;

  update public.path_enrollments
    set completed_courses = case
          when v_course_slug = any(completed_courses) then completed_courses
          else completed_courses || v_course_slug
        end,
        updated_at = now()
    where user_id = v_uid and path_slug = v_slug;

  return found;
end;
$$;
revoke execute on function public.mark_path_course_done(text, text) from anon, public;
grant execute on function public.mark_path_course_done(text, text) to authenticated;

-- ============================================================
-- 5. RPC: klaim bonus kelulusan jalur (+50 poin, sekali per jalur)
-- ============================================================
drop function if exists public.claim_path_bonus(text, integer);
create or replace function public.claim_path_bonus(p_slug text, p_total integer)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_slug     text := lower(btrim(coalesce(p_slug, '')));
  v_done     integer;
  v_awarded  boolean;
  v_reward   integer := 50;
begin
  if v_uid is null then
    raise exception 'Login diperlukan';
  end if;
  if p_total is null or p_total < 1 then
    raise exception 'Jumlah kursus jalur tidak valid';
  end if;

  select coalesce(array_length(completed_courses, 1), 0), bonus_awarded
    into v_done, v_awarded
    from public.path_enrollments
    where user_id = v_uid and path_slug = v_slug;
  if not found then
    raise exception 'Kamu belum mengikuti jalur ini';
  end if;
  if v_awarded then
    return 0; -- idempoten: bonus sudah pernah diambil
  end if;
  if v_done < p_total then
    raise exception 'Selesaikan seluruh kursus dalam jalur dulu (%/%).', v_done, p_total;
  end if;

  update public.path_enrollments
    set bonus_awarded = true, updated_at = now()
    where user_id = v_uid and path_slug = v_slug;

  -- user_stats biasanya sudah ada (trigger handle_new_user); defensif.
  insert into public.user_stats (user_id, points, streak)
  values (v_uid, 0, 0)
  on conflict (user_id) do nothing;
  update public.user_stats
    set points = points + v_reward
    where user_id = v_uid;

  insert into public.notifications (user_id, type, title, body, href)
  values (
    v_uid,
    'achievement',
    'Jalur belajar selesai! +50 poin',
    'Hebat! Kamu menyelesaikan seluruh kursus dalam jalur "' || v_slug || '". Bonus +50 poin masuk ke peringkatmu.',
    '/leaderboard'
  );

  return v_reward;
end;
$$;
revoke execute on function public.claim_path_bonus(text, integer) from anon, public;
grant execute on function public.claim_path_bonus(text, integer) to authenticated;

-- ============================================================
-- 6. Reload schema PostgREST
-- ============================================================
notify pgrst, 'reload schema';
