-- Migration: Growth (Lane Growth) — kode referral + challenges.
-- Melengkapi init (profiles/user_stats/notifications) & reports_reactions_admin
-- (pola RPC SECURITY DEFINER + is_admin() didefinisikan di sana).
--
-- Catatan notifikasi: kolom public.notifications.type = text default 'system'
-- TANPA check constraint (init 20260827000000), jadi insert 'system' aman.
-- Tidak ada helper create_notification di repo ini → insert langsung dari
-- dalam RPC SECURITY DEFINER (definer melewati RLS notifications).

-- ============================================================
-- 1. Kolom referral di profiles
-- ============================================================
alter table public.profiles
  add column if not exists referral_code text;
alter table public.profiles
  add column if not exists referred_by uuid references public.profiles(id);

-- Satu kode per user; null (belum dibuat) dikecualikan dari keunikan.
create unique index if not exists idx_profiles_referral_code
  on public.profiles(referral_code)
  where referral_code is not null;

create index if not exists idx_profiles_referred_by
  on public.profiles(referred_by);

-- ============================================================
-- 2. RPC: pastikan user punya kode referral (dibuat sekali)
-- ============================================================
drop function if exists public.ensure_referral_code();
create or replace function public.ensure_referral_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_code     text;
  v_attempts integer := 0;
begin
  if v_uid is null then
    raise exception 'Login diperlukan';
  end if;

  select p.referral_code into v_code
  from public.profiles p
  where p.id = v_uid;
  if not found then
    raise exception 'Profil tidak ditemukan';
  end if;
  if v_code is not null and v_code <> '' then
    return v_code; -- idempoten: kode sudah ada
  end if;

  loop
    v_attempts := v_attempts + 1;
    if v_attempts > 5 then
      raise exception 'Gagal membuat kode referral, coba lagi';
    end if;

    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    begin
      update public.profiles
        set referral_code = v_code
        where id = v_uid and referral_code is null;
      if found then
        exit; -- berhasil menulis kode baru
      end if;
      -- 0 baris ter-update: kode mungkin sudah dibuat proses lain → baca ulang.
      select p.referral_code into v_code
      from public.profiles p
      where p.id = v_uid;
      if v_code is not null and v_code <> '' then
        return v_code;
      end if;
    exception when unique_violation then
      -- Konflik kode (sangat langka) → loop, coba kode baru.
      null;
    end;
  end loop;

  return v_code;
end;
$$;
-- Fungsi baru default punya EXECUTE untuk PUBLIC; batasi ke authenticated saja.
revoke execute on function public.ensure_referral_code() from anon, public;
grant execute on function public.ensure_referral_code() to authenticated;

-- ============================================================
-- 3. Tabel challenges + challenge_participants
-- ============================================================
create table if not exists public.challenges (
  id            bigint generated always as identity primary key,
  title         text not null,
  description   text not null default '',
  points_reward integer not null default 50,
  starts_at     timestamptz not null default now(),
  ends_at       timestamptz,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_challenges_created_by
  on public.challenges(created_by);

create table if not exists public.challenge_participants (
  challenge_id bigint not null references public.challenges(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  completed    boolean not null default false,
  completed_at timestamptz,
  joined_at    timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create index if not exists idx_challenge_participants_user
  on public.challenge_participants(user_id);

alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;

-- Challenge dilihat semua user (termasuk tamu); tulis admin atau pembuatnya.
drop policy if exists "challenges select public" on public.challenges;
create policy "challenges select public" on public.challenges
  for select using (true);
drop policy if exists "challenges insert admin-or-creator" on public.challenges;
create policy "challenges insert admin-or-creator" on public.challenges
  for insert with check (public.is_admin() or created_by = auth.uid());
drop policy if exists "challenges update admin" on public.challenges;
create policy "challenges update admin" on public.challenges
  for update using (public.is_admin());
drop policy if exists "challenges delete admin" on public.challenges;
create policy "challenges delete admin" on public.challenges
  for delete using (public.is_admin());

-- Partisipasi terlihat semua (jumlah peserta), tulis hanya milik sendiri.
drop policy if exists "challenge_participants select public" on public.challenge_participants;
create policy "challenge_participants select public" on public.challenge_participants
  for select using (true);
drop policy if exists "challenge_participants insert self" on public.challenge_participants;
create policy "challenge_participants insert self" on public.challenge_participants
  for insert with check (user_id = auth.uid());
drop policy if exists "challenge_participants update self" on public.challenge_participants;
create policy "challenge_participants update self" on public.challenge_participants
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- 4a. RPC: list challenges (+ jumlah peserta, status current user)
-- ============================================================
drop function if exists public.list_challenges();
create or replace function public.list_challenges()
returns table (
  id                 bigint,
  title              text,
  description        text,
  points_reward      integer,
  starts_at          timestamptz,
  ends_at            timestamptz,
  participants_count bigint,
  joined             boolean,
  completed          boolean,
  creator_name       text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.title,
    c.description,
    c.points_reward,
    c.starts_at,
    c.ends_at,
    (select count(*)
       from public.challenge_participants cp
       where cp.challenge_id = c.id)        as participants_count,
    (cp_user.user_id is not null)           as joined,
    coalesce(cp_user.completed, false)      as completed,
    coalesce(p.name, '')                    as creator_name
  from public.challenges c
  left join public.challenge_participants cp_user
    on cp_user.challenge_id = c.id
   and cp_user.user_id = auth.uid()         -- null untuk tamu → joined=false
  left join public.profiles p
    on p.id = c.created_by
  order by c.created_at asc, c.id asc;
$$;
grant execute on function public.list_challenges() to anon, authenticated;

-- ============================================================
-- 4b. RPC: join challenge (idempoten)
-- ============================================================
drop function if exists public.join_challenge(bigint);
create or replace function public.join_challenge(p_challenge_id bigint)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Login diperlukan';
  end if;
  if not exists (select 1 from public.challenges c where c.id = p_challenge_id) then
    raise exception 'Challenge tidak ditemukan';
  end if;

  insert into public.challenge_participants (challenge_id, user_id)
  values (p_challenge_id, v_uid)
  on conflict (challenge_id, user_id) do nothing;

  return exists (
    select 1 from public.challenge_participants cp
    where cp.challenge_id = p_challenge_id and cp.user_id = v_uid
  );
end;
$$;
revoke execute on function public.join_challenge(bigint) from anon, public;
grant execute on function public.join_challenge(bigint) to authenticated;

-- ============================================================
-- 4c. RPC: tandai selesai → reward poin sekali saja
-- ============================================================
drop function if exists public.mark_challenge_complete(bigint);
create or replace function public.mark_challenge_complete(p_challenge_id bigint)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_reward integer;
  v_done   boolean := false;
begin
  if v_uid is null then
    raise exception 'Login diperlukan';
  end if;

  select c.points_reward into v_reward
  from public.challenges c
  join public.challenge_participants cp on cp.challenge_id = c.id
  where c.id = p_challenge_id and cp.user_id = v_uid;
  if not found then
    raise exception 'Anda belum ikut challenge ini';
  end if;

  -- completed=false → true; v_done tetap false bila sudah selesai sebelumnya.
  update public.challenge_participants cp
    set completed = true, completed_at = now()
    where cp.challenge_id = p_challenge_id
      and cp.user_id = v_uid
      and cp.completed = false
    returning true into v_done;

  if v_done then
    -- user_stats biasanya sudah ada (trigger handle_new_user); defensif untuk
    -- data lama yang kehilangan baris user_stats.
    insert into public.user_stats (user_id, points, streak)
    values (v_uid, 0, 0)
    on conflict (user_id) do nothing;
    update public.user_stats
      set points = points + v_reward
      where user_id = v_uid;
  end if;

  return v_done;
end;
$$;
revoke execute on function public.mark_challenge_complete(bigint) from anon, public;
grant execute on function public.mark_challenge_complete(bigint) to authenticated;

-- ============================================================
-- 4d. RPC: klaim kode referral → bonus +25/+25 + notifikasi penganjur
-- ============================================================
drop function if exists public.claim_referral(text);
create or replace function public.claim_referral(p_code text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_code     text := upper(btrim(coalesce(p_code, '')));
  v_referrer uuid;
  v_referred uuid;
begin
  if v_uid is null then
    raise exception 'Login diperlukan';
  end if;
  if v_code = '' then
    raise exception 'Kode referral wajib diisi';
  end if;

  select p.id into v_referrer
  from public.profiles p
  where p.referral_code = v_code; -- unik (partial unique index) → max 1 baris
  if v_referrer is null then
    raise exception 'Kode referral tidak ditemukan';
  end if;
  if v_referrer = v_uid then
    raise exception 'Tidak bisa memakai kode referral sendiri';
  end if;

  select p.referred_by into v_referred
  from public.profiles p
  where p.id = v_uid;
  if not found then
    raise exception 'Profil tidak ditemukan';
  end if;
  if v_referred is not null then
    raise exception 'Kamu sudah pernah memakai kode referral';
  end if;

  update public.profiles
    set referred_by = v_referrer
    where id = v_uid;

  -- Bonus +25 untuk klaimer dan +25 untuk penganjur.
  insert into public.user_stats (user_id, points, streak)
  values (v_uid, 0, 0)
  on conflict (user_id) do nothing;
  update public.user_stats
    set points = points + 25
    where user_id = v_uid;

  insert into public.user_stats (user_id, points, streak)
  values (v_referrer, 0, 0)
  on conflict (user_id) do nothing;
  update public.user_stats
    set points = points + 25
    where user_id = v_referrer;

  -- Notifikasi ke penganjur (type 'system' aman: tanpa check constraint).
  insert into public.notifications (user_id, type, title, body, href)
  values (
    v_referrer,
    'system',
    'Kode referral berhasil dipakai!',
    'Seseorang baru saja mendaftar dengan kode referral kamu. Kamu dapat +25 poin!',
    '/challenges'
  );

  return true;
end;
$$;
revoke execute on function public.claim_referral(text) from anon, public;
grant execute on function public.claim_referral(text) to authenticated;

-- ============================================================
-- 5. Seed 2 challenge demo (idempoten by title)
-- ============================================================
insert into public.challenges (title, description, points_reward)
select 'Selesaikan pelajaran pertama',
       'Selesaikan satu pelajaran di kelas mana pun untuk meraih hadiah poin.',
       50
where not exists (
  select 1 from public.challenges where title = 'Selesaikan pelajaran pertama'
);

insert into public.challenges (title, description, points_reward)
select 'Posting proyek pertamamu',
       'Bagikan proyek pertamamu ke galeri proyek komunitas dan dapatkan poin.',
       80
where not exists (
  select 1 from public.challenges where title = 'Posting proyek pertamamu'
);

-- ============================================================
-- 6. Reload schema PostgREST
-- ============================================================
notify pgrst, 'reload schema';
