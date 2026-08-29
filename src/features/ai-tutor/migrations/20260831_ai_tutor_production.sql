-- ============================================================================
-- AI TUTOR PRODUCTION - chat_history + chat_quota
-- Owner: Lane C | Idempotent: aman dijalankan ulang
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. chat_history - riwayat percakapan per user per lesson
-- ---------------------------------------------------------------------------
create table if not exists public.chat_history (
  id                     bigint generated always as identity primary key,
  user_id                uuid not null references public.profiles(id) on delete cascade,
  lesson_id              bigint references public.lessons(id) on delete cascade,
  role                   text not null check (role in ('system','user','assistant')),
  message                text not null,
  tokens_used_prompt     integer not null default 0,
  tokens_used_completion integer not null default 0,
  created_at             timestamptz not null default now()
);

create index if not exists idx_chat_user_lesson on public.chat_history(user_id, lesson_id);
create index if not exists idx_chat_timestamp   on public.chat_history(created_at);

alter table public.chat_history enable row level security;

drop policy if exists "chat history owner select" on public.chat_history;
create policy "chat history owner select" on public.chat_history
  for select using (user_id = auth.uid());

drop policy if exists "chat history owner insert" on public.chat_history;
create policy "chat history owner insert" on public.chat_history
  for insert with check (user_id = auth.uid());

drop policy if exists "chat history owner delete" on public.chat_history;
create policy "chat history owner delete" on public.chat_history
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. chat_quota - kuota harian per user
-- ---------------------------------------------------------------------------
create table if not exists public.chat_quota (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  reset_date  date not null default current_date,
  used_tokens integer not null default 0,
  usage_count integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, reset_date)
);

create index if not exists idx_quota_user_reset on public.chat_quota(user_id, reset_date);

alter table public.chat_quota enable row level security;

drop policy if exists "chat quota owner select" on public.chat_quota;
create policy "chat quota owner select" on public.chat_quota
  for select using (user_id = auth.uid());

-- insert/update dilakukan lewat RPC SECURITY DEFINER di bawah (bypass RLS)

-- ---------------------------------------------------------------------------
-- 3. RPC: tambah pemakaian kuota (upsert atomic per user per hari)
-- ---------------------------------------------------------------------------
drop function if exists public.update_chat_quota(uuid, integer, date);
create or replace function public.update_chat_quota(
  p_user_id uuid,
  p_tokens integer,
  p_reset_date date
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.chat_quota (user_id, reset_date, used_tokens, usage_count)
  values (p_user_id, p_reset_date, greatest(p_tokens, 0), 1)
  on conflict (user_id, reset_date) do update
    set used_tokens = chat_quota.used_tokens + greatest(excluded.used_tokens, 0),
        usage_count = chat_quota.usage_count + 1,
        updated_at  = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. RPC: cek sisa kuota harian
-- ---------------------------------------------------------------------------
drop function if exists public.check_chat_quota(uuid, integer);
create or replace function public.check_chat_quota(
  p_user_id uuid,
  p_daily_limit integer default 20
)
returns table (can_request boolean, remaining integer, used_today integer)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_usage integer;
begin
  select coalesce(cq.usage_count, 0) into v_usage
  from public.chat_quota cq
  where cq.user_id = p_user_id
    and cq.reset_date = current_date;

  -- user tanpa row chat_quota => v_usage null (select into kosong) => anggap 0
  return query
  select
    coalesce(v_usage, 0) < p_daily_limit,
    greatest(0, p_daily_limit - coalesce(v_usage, 0))::integer,
    coalesce(v_usage, 0)::integer;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. RPC maintenance: hapus riwayat chat lama (admin saja)
-- ---------------------------------------------------------------------------
drop function if exists public.cleanup_old_chat_history(integer);
create or replace function public.cleanup_old_chat_history(days_old integer)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_deleted bigint;
begin
  if not public.is_admin() then
    raise exception 'Only admins can run cleanup';
  end if;

  delete from public.chat_history
  where created_at < now() - (days_old || ' days')::interval;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Realtime untuk chat_history (idempotent)
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.chat_history;
exception when others then null; end $$;

-- ---------------------------------------------------------------------------
grant execute on function public.update_chat_quota(uuid, integer, date) to authenticated;
grant execute on function public.check_chat_quota(uuid, integer) to authenticated;
grant execute on function public.cleanup_old_chat_history(integer) to authenticated;

notify pgrst, 'reload schema';
