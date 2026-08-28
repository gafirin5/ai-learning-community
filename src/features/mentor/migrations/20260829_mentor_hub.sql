-- ============================================================================
-- MENTOR HUB - mentoring_sessions, mentor_reviews, mentor_availability
-- Owner: Lane H | Idempotent: aman dijalankan ulang
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. mentoring_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.mentoring_sessions (
  id             bigint generated always as identity primary key,
  mentor_id      uuid not null references public.profiles(id) on delete cascade,
  learner_id     uuid not null references public.profiles(id) on delete cascade,
  course_id      bigint references public.courses(id) on delete set null,
  scheduled_at   timestamptz not null,
  status         text not null default 'pending'
                 check (status in ('pending','confirmed','cancelled','completed')),
  timezone       text not null default 'Asia/Jakarta',
  video_call_url text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (mentor_id, scheduled_at)
);

create index if not exists idx_mentoring_mentor   on public.mentoring_sessions(mentor_id);
create index if not exists idx_mentoring_learner  on public.mentoring_sessions(learner_id);
create index if not exists idx_mentoring_status   on public.mentoring_sessions(status);
create index if not exists idx_mentoring_scheduled on public.mentoring_sessions(scheduled_at);

alter table public.mentoring_sessions enable row level security;

drop policy if exists "mentoring sessions read participants" on public.mentoring_sessions;
create policy "mentoring sessions read participants" on public.mentoring_sessions
  for select using (
    mentor_id = auth.uid() or learner_id = auth.uid() or public.is_admin()
  );

drop policy if exists "mentoring sessions insert participants" on public.mentoring_sessions;
create policy "mentoring sessions insert participants" on public.mentoring_sessions
  for insert with check (mentor_id = auth.uid() or learner_id = auth.uid());

drop policy if exists "mentoring sessions update participants" on public.mentoring_sessions;
create policy "mentoring sessions update participants" on public.mentoring_sessions
  for update using (mentor_id = auth.uid() or learner_id = auth.uid())
  with check (mentor_id = auth.uid() or learner_id = auth.uid());

drop policy if exists "mentoring sessions delete participants" on public.mentoring_sessions;
create policy "mentoring sessions delete participants" on public.mentoring_sessions
  for delete using (mentor_id = auth.uid() or learner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. mentor_reviews
-- ---------------------------------------------------------------------------
create table if not exists public.mentor_reviews (
  id              bigint generated always as identity primary key,
  session_id      bigint not null references public.mentoring_sessions(id) on delete cascade,
  reviewer_id     uuid not null references public.profiles(id) on delete cascade,
  rated_user_uuid uuid not null,
  rating          integer not null check (rating between 1 and 5),
  comment         text,
  is_public       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (session_id, reviewer_id)
);

create index if not exists idx_reviews_session    on public.mentor_reviews(session_id);
create index if not exists idx_reviews_reviewer   on public.mentor_reviews(reviewer_id);
create index if not exists idx_reviews_rated_user on public.mentor_reviews(rated_user_uuid);

alter table public.mentor_reviews enable row level security;

drop policy if exists "mentor reviews read" on public.mentor_reviews;
create policy "mentor reviews read" on public.mentor_reviews
  for select using (
    is_public = true
    or reviewer_id = auth.uid()
    or rated_user_uuid = auth.uid()
    or public.is_admin()
  );

drop policy if exists "mentor reviews insert participant" on public.mentor_reviews;
create policy "mentor reviews insert participant" on public.mentor_reviews
  for insert with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.mentoring_sessions s
      where s.id = session_id
        and s.status = 'completed'
        and (s.learner_id = auth.uid() or s.mentor_id = auth.uid())
    )
  );

drop policy if exists "mentor reviews update reviewer" on public.mentor_reviews;
create policy "mentor reviews update reviewer" on public.mentor_reviews
  for update using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists "mentor reviews delete reviewer" on public.mentor_reviews;
create policy "mentor reviews delete reviewer" on public.mentor_reviews
  for delete using (reviewer_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. mentor_availability
--    (cek jadwal tumpang tindih divalidasi di aplikasi, bukan CHECK constraint —
--     Postgres tidak mengizinkan subquery di dalam CHECK)
-- ---------------------------------------------------------------------------
create table if not exists public.mentor_availability (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time   time not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

create index if not exists idx_availability_user on public.mentor_availability(user_id);
create index if not exists idx_availability_day  on public.mentor_availability(day_of_week);

alter table public.mentor_availability enable row level security;

drop policy if exists "mentor availability owner" on public.mentor_availability;
create policy "mentor availability owner" on public.mentor_availability
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "mentor availability read all" on public.mentor_availability;
create policy "mentor availability read all" on public.mentor_availability
  for select using (true);

-- ---------------------------------------------------------------------------
-- 4. RPC: buat sesi (peserta saja)
-- ---------------------------------------------------------------------------
drop function if exists public.create_mentoring_session(uuid, uuid, timestamptz, bigint);
create or replace function public.create_mentoring_session(
  p_mentor_id uuid,
  p_learner_id uuid,
  p_scheduled_at timestamptz,
  p_course_id bigint default null
)
returns table (session_id bigint, status text)
language plpgsql security definer set search_path = public
as $$
begin
  -- hanya mentor atau learner ybs. yang boleh memicu pembuatan
  if p_mentor_id <> auth.uid() and p_learner_id <> auth.uid() then
    return query select null::bigint, null::text;
    return;
  end if;

  return query
  insert into public.mentoring_sessions (mentor_id, learner_id, scheduled_at, course_id)
  values (p_mentor_id, p_learner_id, p_scheduled_at, p_course_id)
  returning mentoring_sessions.id, mentoring_sessions.status;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. RPC: ubah status sesi (peserta/admin saja)
-- ---------------------------------------------------------------------------
drop function if exists public.update_booking_status(bigint, text);
create or replace function public.update_booking_status(
  p_session_id bigint,
  p_new_status text
)
returns table (success boolean, message text)
language plpgsql security definer set search_path = public
as $$
begin
  if p_new_status not in ('pending','confirmed','cancelled','completed') then
    return query select false::boolean, 'Invalid status value'::text;
    return;
  end if;

  if not exists (
    select 1 from public.mentoring_sessions s
    where s.id = p_session_id
      and (s.mentor_id = auth.uid() or s.learner_id = auth.uid() or public.is_admin())
  ) then
    return query select false::boolean, 'Session not found or not permitted'::text;
    return;
  end if;

  return query
  update public.mentoring_sessions s
  set status = p_new_status, updated_at = now()
  where s.id = p_session_id
  returning true::boolean, 'Status updated'::text;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. RPC: kirim review (peserta sesi yang sudah selesai)
-- ---------------------------------------------------------------------------
drop function if exists public.submit_mentor_review(bigint, uuid, uuid, integer, text, boolean);
drop function if exists public.submit_mentor_review(bigint, uuid, integer, text, boolean);
create or replace function public.submit_mentor_review(
  p_session_id bigint,
  p_rated_user_uuid uuid,
  p_rating integer,
  p_comment text,
  p_is_public boolean
)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_id bigint;
begin
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  if not exists (
    select 1 from public.mentoring_sessions s
    where s.id = p_session_id
      and s.status = 'completed'
      and (s.learner_id = auth.uid() or s.mentor_id = auth.uid())
  ) then
    raise exception 'Session not found, not completed, or not permitted';
  end if;

  insert into public.mentor_reviews (session_id, reviewer_id, rated_user_uuid, rating, comment, is_public)
  values (p_session_id, auth.uid(), p_rated_user_uuid, p_rating, p_comment, p_is_public)
  returning mentor_reviews.id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. RPC: slot tersedia mentor dalam rentang tanggal (belum dibooking)
-- ---------------------------------------------------------------------------
drop function if exists public.get_available_slots(uuid, date, date);
create or replace function public.get_available_slots(
  p_mentor_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (slot_id bigint, mentor_name text, scheduled_at timestamptz, status text)
language plpgsql stable security definer set search_path = public
as $$
begin
  return query
  select
    ma.id,
    p.name,
    (d.day_date + ma.start_time)::timestamptz,
    'available'::text
  from public.mentor_availability ma
  join public.profiles p on p.id = ma.user_id
  cross join lateral generate_series(
    p_start_date::timestamp, p_end_date::timestamp, interval '1 day'
  ) as d(day_date)
  where ma.user_id = p_mentor_id
    and ma.is_active = true
    and extract(dow from d.day_date) = ma.day_of_week
    and not exists (
      select 1 from public.mentoring_sessions ms
      where ms.mentor_id = p_mentor_id
        and ms.status in ('pending','confirmed')
        and ms.scheduled_at::date = d.day_date::date
        and ms.scheduled_at::time >= ma.start_time
        and ms.scheduled_at::time < ma.end_time
    )
  order by d.day_date, ma.start_time;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Realtime (idempotent — lewati bila sudah jadi anggota publication)
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.mentoring_sessions;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.mentor_reviews;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.mentor_availability;
exception when others then null; end $$;

-- ---------------------------------------------------------------------------
grant execute on function public.create_mentoring_session(uuid, uuid, timestamptz, bigint) to authenticated;
grant execute on function public.update_booking_status(bigint, text) to authenticated;
grant execute on function public.submit_mentor_review(bigint, uuid, integer, text, boolean) to authenticated;
grant execute on function public.get_available_slots(uuid, date, date) to authenticated;

notify pgrst, 'reload schema';
