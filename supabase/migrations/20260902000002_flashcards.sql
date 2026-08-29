-- Migration: Learning Lab — Kartu Hafalan SRS (flashcard_progress).
-- SM-2 dihitung di client (src/lib/srs/sm2.ts) lalu hasil state di-upsert
-- ke sini — jadi tidak perlu RPC; tabel + RLS owner-only saja.

-- ============================================================
-- 1. Tabel flashcard_progress (owner-only)
-- ============================================================
create table if not exists public.flashcard_progress (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  card_id          integer not null,
  ease             real not null default 2.5,
  interval_days    integer not null default 0,
  repetitions      integer not null default 0,
  due_at           date not null default current_date,
  last_reviewed_at timestamptz,
  primary key (user_id, card_id)
);

create index if not exists idx_flashcard_progress_due
  on public.flashcard_progress(user_id, due_at);

alter table public.flashcard_progress enable row level security;

drop policy if exists "flashcard_progress select self" on public.flashcard_progress;
create policy "flashcard_progress select self" on public.flashcard_progress
  for select using (user_id = auth.uid());
drop policy if exists "flashcard_progress insert self" on public.flashcard_progress;
create policy "flashcard_progress insert self" on public.flashcard_progress
  for insert with check (user_id = auth.uid());
drop policy if exists "flashcard_progress update self" on public.flashcard_progress;
create policy "flashcard_progress update self" on public.flashcard_progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "flashcard_progress delete self" on public.flashcard_progress;
create policy "flashcard_progress delete self" on public.flashcard_progress
  for delete using (user_id = auth.uid());

-- ============================================================
-- 2. Reload schema PostgREST
-- ============================================================
notify pgrst, 'reload schema';
