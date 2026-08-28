-- Migration: lapisan tulis (RPC) untuk operasi learner-facing.
-- Fungsi SECURITY DEFINER menangani counter/poin secara atomic tanpa race,
-- dan membatasi penulisan hanya ke data milik auth.uid().

-- ============================================================
-- Toggle vote thread: delta=1|-1, mengembalikan vote_count + my_vote
-- ============================================================
create or replace function public.toggle_thread_vote(p_thread_id bigint, p_delta integer)
returns table (vote_count integer, my_vote integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_prev integer := 0;
  v_next integer;
  v_net integer;
begin
  select tv.value into v_prev from thread_votes tv where tv.user_id = v_uid and tv.thread_id = p_thread_id;
  v_prev := coalesce(v_prev, 0);

  if p_delta not in (-1, 1) then
    raise exception 'delta harus -1 atau 1';
  end if;

  v_next := case when v_prev = p_delta then 0 else p_delta end;
  v_net := v_next - v_prev;

  if v_next = 0 then
    delete from thread_votes where user_id = v_uid and thread_id = p_thread_id;
  else
    insert into thread_votes (user_id, thread_id, value) values (v_uid, p_thread_id, v_next)
    on conflict (user_id, thread_id) do update set value = excluded.value;
  end if;

  update threads set vote_count = threads.vote_count + v_net where id = p_thread_id;
  select t.vote_count, v_next into vote_count, my_vote from threads t where t.id = p_thread_id;
  return next;
end;
$$;

-- ============================================================
-- Toggle vote komentar
-- ============================================================
create or replace function public.toggle_comment_vote(p_comment_id bigint, p_delta integer)
returns table (vote_count integer, my_vote integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_prev integer := 0;
  v_next integer;
  v_net integer;
begin
  select cv.value into v_prev from comment_votes cv where cv.user_id = v_uid and cv.comment_id = p_comment_id;
  v_prev := coalesce(v_prev, 0);
  if p_delta not in (-1, 1) then
    raise exception 'delta harus -1 atau 1';
  end if;
  v_next := case when v_prev = p_delta then 0 else p_delta end;
  v_net := v_next - v_prev;

  if v_next = 0 then
    delete from comment_votes where user_id = v_uid and comment_id = p_comment_id;
  else
    insert into comment_votes (user_id, comment_id, value) values (v_uid, p_comment_id, v_next)
    on conflict (user_id, comment_id) do update set value = excluded.value;
  end if;

  update comments set vote_count = comments.vote_count + v_net where id = p_comment_id;
  select c.vote_count, v_next into vote_count, my_vote from comments c where c.id = p_comment_id;
  return next;
end;
$$;

-- ============================================================
-- Toggle vote proyek (like_count)
-- ============================================================
create or replace function public.toggle_project_vote(p_project_id bigint, p_delta integer)
returns table (like_count integer, my_vote integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_prev integer := 0;
  v_next integer;
  v_net integer;
begin
  select pv.value into v_prev from project_votes pv where pv.user_id = v_uid and pv.project_id = p_project_id;
  v_prev := coalesce(v_prev, 0);
  if p_delta not in (-1, 1) then
    raise exception 'delta harus -1 atau 1';
  end if;
  v_next := case when v_prev = p_delta then 0 else p_delta end;
  v_net := v_next - v_prev;

  if v_next = 0 then
    delete from project_votes where user_id = v_uid and project_id = p_project_id;
  else
    insert into project_votes (user_id, project_id, value) values (v_uid, p_project_id, v_next)
    on conflict (user_id, project_id) do update set value = excluded.value;
  end if;

  update projects set like_count = projects.like_count + v_net where id = p_project_id;
  select p.like_count, v_next into like_count, my_vote from projects p where p.id = p_project_id;
  return next;
end;
$$;

-- ============================================================
-- Set pelajaran selesai/belum + skor kuis, atomik dengan poin (±10)
-- ============================================================
create or replace function public.set_lesson_done(p_lesson_id bigint, p_done boolean, p_quiz_score integer)
returns table (status text, points integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_was_done boolean;
  v_status text;
  v_points integer;
  v_delta integer := 0;
begin
  select (p.status = 'selesai') into v_was_done from progress p
    where p.user_id = v_uid and p.lesson_id = p_lesson_id;
  v_was_done := coalesce(v_was_done, false);

  v_status := case when p_done then 'selesai' else 'belum' end;

  insert into progress (user_id, lesson_id, status, quiz_score) values (v_uid, p_lesson_id, v_status, p_quiz_score)
  on conflict (user_id, lesson_id) do update set
    status = excluded.status,
    quiz_score = coalesce(excluded.quiz_score, progress.quiz_score),
    updated_at = now();

  if (not v_was_done) and p_done then v_delta := 10; end if;
  if v_was_done and (not p_done) then v_delta := -10; end if;

  insert into user_stats (user_id, points, streak) values (v_uid, 0, 0)
  on conflict (user_id) do nothing;

  update user_stats set points = greatest(0, user_stats.points + v_delta) where user_id = v_uid;

  select s.points into v_points from user_stats s where s.user_id = v_uid;
  status := v_status;
  points := v_points;
  return next;
end;
$$;

-- ============================================================
-- Touch aktivitas (streak harian)
-- ============================================================
create or replace function public.touch_activity()
returns table (streak integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := current_date;
  v_yesterday date := current_date - interval '1 day';
  v_streak integer;
  v_last date;
begin
  insert into user_stats (user_id, points, streak, last_active) values (v_uid, 0, 0, null)
  on conflict (user_id) do nothing;

  select s.streak, s.last_active into v_streak, v_last from user_stats s where s.user_id = v_uid;

  if v_last is distinct from v_today then
    v_streak := case when v_last = v_yesterday then coalesce(v_streak, 0) + 1 else 1 end;
    update user_stats set streak = v_streak, last_active = v_today where user_id = v_uid;
  end if;

  streak := v_streak;
  return next;
end;
$$;

-- ============================================================
-- Increment view count thread
-- ============================================================
create or replace function public.increment_thread_view(p_thread_id bigint)
returns table (view_count integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  update threads set view_count = view_count + 1 where id = p_thread_id;
  select t.view_count into view_count from threads t where t.id = p_thread_id;
  return next;
end;
$$;

-- Izinkan user ter-autentikasi memanggil RPC di atas.
grant execute on function public.toggle_thread_vote(bigint, integer) to authenticated;
grant execute on function public.toggle_comment_vote(bigint, integer) to authenticated;
grant execute on function public.toggle_project_vote(bigint, integer) to authenticated;
grant execute on function public.set_lesson_done(bigint, boolean, integer) to authenticated;
grant execute on function public.touch_activity() to authenticated;
grant execute on function public.increment_thread_view(bigint) to authenticated;
