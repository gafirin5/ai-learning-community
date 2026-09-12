-- Migration: Catatan Pribadi per Pelajaran (Lane C) — tabel lesson_notes,
-- RLS owner-only. Pola sama dengan flashcard_progress (upsert langsung dari
-- client, tanpa RPC — tidak ada agregasi/logika lintas user).

create table if not exists public.lesson_notes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  lesson_id  bigint not null references public.lessons(id) on delete cascade,
  content    text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists idx_lesson_notes_user on public.lesson_notes(user_id);

alter table public.lesson_notes enable row level security;

drop policy if exists "lesson_notes select self" on public.lesson_notes;
create policy "lesson_notes select self" on public.lesson_notes
  for select using (user_id = auth.uid());
drop policy if exists "lesson_notes insert self" on public.lesson_notes;
create policy "lesson_notes insert self" on public.lesson_notes
  for insert with check (user_id = auth.uid());
drop policy if exists "lesson_notes update self" on public.lesson_notes;
create policy "lesson_notes update self" on public.lesson_notes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "lesson_notes delete self" on public.lesson_notes;
create policy "lesson_notes delete self" on public.lesson_notes
  for delete using (user_id = auth.uid());

notify pgrst, 'reload schema';
