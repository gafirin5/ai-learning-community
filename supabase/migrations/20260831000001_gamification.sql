-- Migration: Gamifikasi (Lane F) — RPC leaderboard publik per periode.
-- Skor = poin belajar (user_stats.points) + 15/thread + 5/komentar + 30/proyek
-- (disamakan dengan COMMUNITY_POINTS di src/lib/store/gamification.ts).
-- SECURITY DEFINER karena user_stats dilindungi RLS owner-only, sedangkan
-- leaderboard harus menampilkan poin/streak semua user.

-- Idempoten: buang definisi lama dulu (return type berubah aman di-replay).
drop function if exists public.get_leaderboard(text);

create or replace function public.get_leaderboard(p_period text default 'all')
returns table (
  uuid           uuid,
  name           text,
  role           text,
  avatar_url     text,
  learning_points integer,
  streak         integer,
  thread_count   bigint,
  comment_count  bigint,
  project_count  bigint,
  score          bigint
)
language sql
security definer
set search_path = public
as $$
  with params as (
    -- p_period di luar ('all','weekly','monthly') jatuh ke 'all' (since = null).
    select case
      when p_period = 'weekly'  then now() - interval '7 days'
      when p_period = 'monthly' then now() - interval '30 days'
      else null::timestamptz
    end as since
  ),
  tc as (
    select t.user_id, count(*) as cnt
    from threads t cross join params v
    where t.hidden = false
      and (v.since is null or t.created_at >= v.since)
    group by t.user_id
  ),
  cc as (
    select c.user_id, count(*) as cnt
    from comments c cross join params v
    where c.hidden = false
      and (v.since is null or c.created_at >= v.since)
    group by c.user_id
  ),
  pc as (
    select p.user_id, count(*) as cnt
    from projects p cross join params v
    where v.since is null or p.created_at >= v.since
    group by p.user_id
  )
  select
    pr.id                          as uuid,
    pr.name                        as name,
    pr.role                        as role,
    pr.avatar_url                  as avatar_url,
    coalesce(us.points, 0)::int    as learning_points,
    coalesce(us.streak, 0)::int    as streak,
    coalesce(tc.cnt, 0)::bigint    as thread_count,
    coalesce(cc.cnt, 0)::bigint    as comment_count,
    coalesce(pc.cnt, 0)::bigint    as project_count,
    (coalesce(us.points, 0)
      + coalesce(tc.cnt, 0) * 15
      + coalesce(cc.cnt, 0) * 5
      + coalesce(pc.cnt, 0) * 30)::bigint as score
  from profiles pr
  left join user_stats us on us.user_id = pr.id
  left join tc on tc.user_id = pr.id
  left join cc on cc.user_id = pr.id
  left join pc on pc.user_id = pr.id
  where coalesce(us.points, 0)
      + coalesce(tc.cnt, 0) * 15
      + coalesce(cc.cnt, 0) * 5
      + coalesce(pc.cnt, 0) * 30 > 0
  order by score desc, learning_points desc, name asc
  limit 50;
$$;

-- Leaderboard dilihat halaman publik (termasuk tamu) → grant anon juga.
grant execute on function public.get_leaderboard(text) to anon, authenticated;

notify pgrst, 'reload schema';
