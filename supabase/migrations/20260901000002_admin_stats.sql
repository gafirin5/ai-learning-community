-- ============================================================================
-- ADMIN ANALYTICS - agregat server-side (guard is_admin)
-- Owner: Lane G | Idempotent
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Time-series harian (default 14 hari terakhir)
-- ---------------------------------------------------------------------------
drop function if exists public.get_admin_stats(integer);
create or replace function public.get_admin_stats(p_days integer default 14)
returns table (
  "day" date,
  new_users bigint,
  new_threads bigint,
  new_comments bigint,
  new_projects bigint,
  new_progress bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can view analytics';
  end if;

  return query
  with days as (
    select generate_series(
      current_date - (greatest(p_days, 1) - 1),
      current_date,
      interval '1 day'
    )::date as d
  )
  select
    days.d,
    (select count(*) from public.profiles p  where p.created_at::date  = days.d),
    (select count(*) from public.threads t   where t.created_at::date  = days.d and t.hidden = false),
    (select count(*) from public.comments c  where c.created_at::date  = days.d and c.hidden = false),
    (select count(*) from public.projects pr where pr.created_at::date = days.d),
    (select count(*) from public.progress pg where pg.created_at::date = days.d)
  from days
  order by days.d;
end;
$$;

-- ---------------------------------------------------------------------------
-- Total keseluruhan untuk kartu ringkas
-- ---------------------------------------------------------------------------
drop function if exists public.get_admin_totals();
create or replace function public.get_admin_totals()
returns table (
  total_users bigint,
  total_courses bigint,
  total_lessons bigint,
  total_threads bigint,
  total_comments bigint,
  total_projects bigint,
  total_progress_done bigint,
  open_reports bigint,
  avg_quiz_score numeric,
  active_streaks bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can view analytics';
  end if;

  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.courses),
    (select count(*) from public.lessons),
    (select count(*) from public.threads where hidden = false),
    (select count(*) from public.comments where hidden = false),
    (select count(*) from public.projects),
    (select count(*) from public.progress where status = 'selesai'),
    (select count(*) from public.reports where status = 'open'),
    (select coalesce(round(avg(quiz_score), 1), 0) from public.progress where quiz_score is not null),
    (select count(*) from public.user_stats where streak >= 3);
end;
$$;

grant execute on function public.get_admin_stats(integer) to authenticated;
grant execute on function public.get_admin_totals() to authenticated;

notify pgrst, 'reload schema';
