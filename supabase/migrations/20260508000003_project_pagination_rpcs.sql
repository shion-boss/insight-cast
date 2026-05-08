-- プロジェクト詳細ページの「未記事化テーマ」をサーバーページネーション化するための RPC。
-- 既存ロジック:
--   articles_count(interview) < themes_count(interview) を満たすインタビューを抽出し、
--   それらの themes を全部 unroll して並べる。
-- これを SQL 側で再現し、offset/limit で切り出す。
-- interviews.themes は text[] なので unnest / array_length を使う。

create or replace function public.get_project_uncreated_themes(
  p_project_id uuid,
  p_offset int default 0,
  p_limit int default 5
)
returns table(
  theme text,
  interview_id uuid,
  interviewer_type text,
  interview_created_at timestamptz,
  ordinality int
)
language sql
stable
security invoker
set search_path = public
as $$
  with interview_articles as (
    select interview_id, count(*)::int as article_count
    from articles
    where project_id = p_project_id
      and deleted_at is null
      and interview_id is not null
    group by interview_id
  ),
  qualifying as (
    select i.id, i.interviewer_type, i.created_at, i.themes
    from interviews i
    left join interview_articles ia on ia.interview_id = i.id
    where i.project_id = p_project_id
      and i.deleted_at is null
      and i.themes is not null
      and coalesce(array_length(i.themes, 1), 0) > coalesce(ia.article_count, 0)
  )
  select
    t.value::text as theme,
    q.id as interview_id,
    q.interviewer_type::text,
    q.created_at as interview_created_at,
    t.ordinality::int
  from qualifying q
  cross join lateral unnest(q.themes) with ordinality as t(value, ordinality)
  where trim(t.value::text) <> ''
  order by q.created_at desc, t.ordinality asc
  offset p_offset
  limit p_limit;
$$;

create or replace function public.count_project_uncreated_themes(p_project_id uuid)
returns int
language sql
stable
security invoker
set search_path = public
as $$
  with interview_articles as (
    select interview_id, count(*)::int as article_count
    from articles
    where project_id = p_project_id
      and deleted_at is null
      and interview_id is not null
    group by interview_id
  ),
  qualifying as (
    select i.id, i.themes
    from interviews i
    left join interview_articles ia on ia.interview_id = i.id
    where i.project_id = p_project_id
      and i.deleted_at is null
      and i.themes is not null
      and coalesce(array_length(i.themes, 1), 0) > coalesce(ia.article_count, 0)
  )
  select coalesce((
    select count(*)::int
    from qualifying q
    cross join lateral unnest(q.themes) with ordinality as t(value, ordinality)
    where trim(t.value::text) <> ''
  ), 0);
$$;

grant execute on function public.get_project_uncreated_themes(uuid, int, int) to authenticated, service_role;
grant execute on function public.count_project_uncreated_themes(uuid) to authenticated, service_role;
