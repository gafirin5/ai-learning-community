-- ============================================================================
-- REALTIME NOTIFICATIONS - fungsi notifikasi + trigger forum reply
-- Owner: Lane I | Idempotent: aman dijalankan ulang
--
-- Catatan: tabel public.notifications SUDAH ada dari migration init
-- (dengan policy "notifications owner" FOR ALL owner-only). File ini TIDAK
-- menambah policy longgar baru - insert lintas-user dilakukan lewat
-- create_notification() SECURITY DEFINER (bypass RLS sebagai table owner).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. RPC: buat notifikasi untuk user mana pun (dipakai trigger & fitur lain)
-- ---------------------------------------------------------------------------
drop function if exists public.create_notification(uuid, text, text, text, text);
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_href text default null
)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_id bigint;
begin
  insert into public.notifications (user_id, type, title, body, href)
  values (p_user_id, p_type, p_title, p_body, p_href)
  returning notifications.id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Trigger: notifikasi otomatis saat ada komentar baru di thread
--    (pengarang thread tidak dinotifikasi jika komentarnya sendiri)
-- ---------------------------------------------------------------------------
drop function if exists public.handle_new_comment_notification();
create or replace function public.handle_new_comment_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_author uuid;
  v_thread_title text;
begin
  select t.user_id, t.title into v_author, v_thread_title
  from public.threads t
  where t.id = new.thread_id;

  if v_author is null or v_author = new.user_id then
    return new;
  end if;

  perform public.create_notification(
    v_author,
    'forum_reply',
    'Balasan baru di thread kamu',
    coalesce(v_thread_title, 'Thread kamu') || ' — ' || left(new.body, 80),
    '/forum/' || new.thread_id::text
  );

  return new;
exception when others then
  -- notifikasi tidak boleh menggagalkan insert komentar
  return new;
end;
$$;

drop trigger if exists trigger_comment_notification on public.comments;
create trigger trigger_comment_notification
  after insert on public.comments
  for each row
  execute function public.handle_new_comment_notification();

-- ---------------------------------------------------------------------------
-- 3. RPC maintenance: hapus notifikasi lama yang sudah dibaca (admin saja)
-- ---------------------------------------------------------------------------
drop function if exists public.cleanup_old_notifications(integer);
create or replace function public.cleanup_old_notifications(days_old integer)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_deleted bigint;
begin
  if not public.is_admin() then
    raise exception 'Only admins can run cleanup';
  end if;

  delete from public.notifications
  where created_at < now() - (days_old || ' days')::interval
    and read = true;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Realtime untuk tabel notifications (idempotent)
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null; end $$;

-- ---------------------------------------------------------------------------
grant execute on function public.create_notification(uuid, text, text, text, text) to authenticated;
grant execute on function public.cleanup_old_notifications(integer) to authenticated;

notify pgrst, 'reload schema';
