-- Migration: Kartu Hafalan — Deck buatan pengguna + sharing/template.
-- Lanjutan flashcard_progress (20260902000002_flashcards.sql).
--
-- Kartu bawaan (seed statis di src/lib/data/flashcards.ts, id 1-33) TIDAK
-- dipindah ke DB. flashcard_progress.card_id (integer, tanpa FK) dipakai
-- bersama oleh kartu bawaan maupun kartu deck baru — supaya tidak pernah
-- bertabrakan, sequence id flashcard_cards dimulai jauh di atas (100000).

-- ============================================================
-- 1. Tabel flashcard_decks — publik bila is_public=true, tulis owner-only.
-- ============================================================
create table if not exists public.flashcard_decks (
  id             bigint generated always as identity primary key,
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  description    text not null default '',
  is_public      boolean not null default false,
  source_deck_id bigint references public.flashcard_decks(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_flashcard_decks_owner on public.flashcard_decks(owner_id);
create index if not exists idx_flashcard_decks_public on public.flashcard_decks(is_public);

-- ============================================================
-- 2. Tabel flashcard_cards — id mulai dari 100000 (hindari kolisi dengan
--    id kartu bawaan statis 1-33 di flashcard_progress.card_id).
-- ============================================================
create table if not exists public.flashcard_cards (
  id         bigint generated always as identity (start with 100000) primary key,
  deck_id    bigint not null references public.flashcard_decks(id) on delete cascade,
  front      text not null,
  back       text not null,
  hint       text,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_flashcard_cards_deck on public.flashcard_cards(deck_id);

alter table public.flashcard_decks enable row level security;
alter table public.flashcard_cards enable row level security;

drop policy if exists "flashcard_decks select visible" on public.flashcard_decks;
create policy "flashcard_decks select visible" on public.flashcard_decks
  for select using (is_public = true or owner_id = auth.uid());
drop policy if exists "flashcard_decks insert self" on public.flashcard_decks;
create policy "flashcard_decks insert self" on public.flashcard_decks
  for insert with check (owner_id = auth.uid());
drop policy if exists "flashcard_decks update self" on public.flashcard_decks;
create policy "flashcard_decks update self" on public.flashcard_decks
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "flashcard_decks delete self" on public.flashcard_decks;
create policy "flashcard_decks delete self" on public.flashcard_decks
  for delete using (owner_id = auth.uid());

drop policy if exists "flashcard_cards select visible" on public.flashcard_cards;
create policy "flashcard_cards select visible" on public.flashcard_cards
  for select using (
    exists (
      select 1 from public.flashcard_decks d
      where d.id = flashcard_cards.deck_id
        and (d.is_public = true or d.owner_id = auth.uid())
    )
  );
drop policy if exists "flashcard_cards insert owner" on public.flashcard_cards;
create policy "flashcard_cards insert owner" on public.flashcard_cards
  for insert with check (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.owner_id = auth.uid())
  );
drop policy if exists "flashcard_cards update owner" on public.flashcard_cards;
create policy "flashcard_cards update owner" on public.flashcard_cards
  for update using (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.owner_id = auth.uid())
  );
drop policy if exists "flashcard_cards delete owner" on public.flashcard_cards;
create policy "flashcard_cards delete owner" on public.flashcard_cards
  for delete using (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.owner_id = auth.uid())
  );

-- ============================================================
-- 3. RPC: simpan deck + ganti seluruh kartunya sekali jalan (atomik).
--    p_deck_id null → buat deck baru. p_cards: jsonb array [{front,back,hint}].
-- ============================================================
drop function if exists public.save_flashcard_deck(bigint, text, text, boolean, jsonb);
create or replace function public.save_flashcard_deck(
  p_deck_id     bigint,
  p_title       text,
  p_description text,
  p_is_public   boolean,
  p_cards       jsonb
)
returns bigint
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_deck_id bigint;
  v_title   text := btrim(coalesce(p_title, ''));
  v_card    jsonb;
  v_pos     integer := 0;
begin
  if v_uid is null then
    raise exception 'Login diperlukan';
  end if;
  if v_title = '' then
    raise exception 'Judul deck wajib diisi';
  end if;
  if jsonb_typeof(p_cards) is distinct from 'array' or jsonb_array_length(p_cards) = 0 then
    raise exception 'Deck butuh minimal 1 kartu';
  end if;

  if p_deck_id is null then
    insert into public.flashcard_decks (owner_id, title, description, is_public)
    values (v_uid, v_title, coalesce(p_description, ''), coalesce(p_is_public, false))
    returning id into v_deck_id;
  else
    update public.flashcard_decks
      set title = v_title,
          description = coalesce(p_description, ''),
          is_public = coalesce(p_is_public, false),
          updated_at = now()
      where id = p_deck_id and owner_id = v_uid
      returning id into v_deck_id;
    if v_deck_id is null then
      raise exception 'Deck tidak ditemukan atau bukan milik Anda';
    end if;
    delete from public.flashcard_cards where deck_id = v_deck_id;
  end if;

  for v_card in select * from jsonb_array_elements(p_cards)
  loop
    if btrim(coalesce(v_card->>'front', '')) = '' or btrim(coalesce(v_card->>'back', '')) = '' then
      continue; -- lewati kartu kosong (defensif — UI sudah validasi)
    end if;
    insert into public.flashcard_cards (deck_id, front, back, hint, position)
    values (
      v_deck_id,
      v_card->>'front',
      v_card->>'back',
      nullif(v_card->>'hint', ''),
      v_pos
    );
    v_pos := v_pos + 1;
  end loop;

  if v_pos = 0 then
    raise exception 'Deck butuh minimal 1 kartu valid (depan & belakang tidak boleh kosong)';
  end if;

  return v_deck_id;
end;
$$;
revoke execute on function public.save_flashcard_deck(bigint, text, text, boolean, jsonb) from anon, public;
grant execute on function public.save_flashcard_deck(bigint, text, text, boolean, jsonb) to authenticated;

-- ============================================================
-- 4. RPC: duplikat deck (punya sendiri atau publik) jadi milik sendiri —
--    ini yang mewujudkan "pakai deck orang lain sebagai template".
-- ============================================================
drop function if exists public.clone_flashcard_deck(bigint);
create or replace function public.clone_flashcard_deck(p_deck_id bigint)
returns bigint
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_src    record;
  v_new_id bigint;
begin
  if v_uid is null then
    raise exception 'Login diperlukan';
  end if;

  select * into v_src
  from public.flashcard_decks d
  where d.id = p_deck_id and (d.is_public = true or d.owner_id = v_uid);
  if not found then
    raise exception 'Deck tidak ditemukan atau tidak bisa diakses';
  end if;

  insert into public.flashcard_decks (owner_id, title, description, is_public, source_deck_id)
  values (v_uid, v_src.title || ' (salinan)', v_src.description, false, p_deck_id)
  returning id into v_new_id;

  insert into public.flashcard_cards (deck_id, front, back, hint, position)
  select v_new_id, front, back, hint, position
  from public.flashcard_cards
  where deck_id = p_deck_id
  order by position asc;

  return v_new_id;
end;
$$;
revoke execute on function public.clone_flashcard_deck(bigint) from anon, public;
grant execute on function public.clone_flashcard_deck(bigint) to authenticated;

-- ============================================================
-- 5. RPC: daftar deck ('mine' | 'public') + jumlah kartu + nama pemilik.
--    scope 'public' mengecualikan deck milik sendiri (tab "Komunitas"
--    tidak duplikat dengan tab "Buatan Saya" di UI).
-- ============================================================
drop function if exists public.list_flashcard_decks(text);
create or replace function public.list_flashcard_decks(p_scope text default 'public')
returns table (
  id           bigint,
  title        text,
  description  text,
  is_public    boolean,
  owner_id     uuid,
  owner_name   text,
  card_count   bigint,
  is_mine      boolean,
  created_at   timestamptz,
  updated_at   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.id,
    d.title,
    d.description,
    d.is_public,
    d.owner_id,
    coalesce(p.name, 'Pembelajar') as owner_name,
    (select count(*) from public.flashcard_cards c where c.deck_id = d.id) as card_count,
    (d.owner_id = auth.uid()) as is_mine,
    d.created_at,
    d.updated_at
  from public.flashcard_decks d
  left join public.profiles p on p.id = d.owner_id
  where
    case
      when p_scope = 'mine' then d.owner_id = auth.uid()
      else d.is_public = true and d.owner_id is distinct from auth.uid()
    end
  order by d.updated_at desc;
$$;
revoke execute on function public.list_flashcard_decks(text) from anon, public;
grant execute on function public.list_flashcard_decks(text) to authenticated;

notify pgrst, 'reload schema';
