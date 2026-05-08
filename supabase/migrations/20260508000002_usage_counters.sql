-- 制限カウンター: usage_counters（月次）と user_lifetime_usage（累計）
-- articles INSERT / interviews INSERT 時に DB トリガで自動 increment する。
-- 削除（soft-delete も hard-delete も）でカウンターは戻さない方針。
-- 「新規作成された本数」基準で枠を消費する設計。
-- 失敗した記事生成は articles に INSERT されないため、自然に枠を消費しない。

create table usage_counters (
  user_id            uuid not null references auth.users(id) on delete cascade,
  month_key          text not null,
  articles_created   int  not null default 0,
  interviews_created int  not null default 0,
  updated_at         timestamptz not null default now(),
  primary key (user_id, month_key)
);

create table user_lifetime_usage (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  articles_created   int  not null default 0,
  interviews_created int  not null default 0,
  updated_at         timestamptz not null default now()
);

alter table usage_counters       enable row level security;
alter table user_lifetime_usage  enable row level security;

-- 読み取りは自分の行のみ（書き込みはトリガ security definer 経由）
create policy "own usage_counters" on usage_counters
  for select to authenticated
  using (user_id = auth.uid());

create policy "own user_lifetime_usage" on user_lifetime_usage
  for select to authenticated
  using (user_id = auth.uid());

-- JST 月キー（'YYYY-MM'）を返すヘルパー
create or replace function jst_month_key(ts timestamptz)
returns text
language sql
immutable
as $$
  select to_char((ts at time zone 'Asia/Tokyo')::date, 'YYYY-MM');
$$;

-- articles INSERT 時のカウンター increment
create or replace function increment_articles_counter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  current_month text;
begin
  select user_id into owner_id from projects where id = NEW.project_id;
  if owner_id is null then
    return NEW;
  end if;

  current_month := jst_month_key(NEW.created_at);

  insert into usage_counters (user_id, month_key, articles_created)
  values (owner_id, current_month, 1)
  on conflict (user_id, month_key) do update
    set articles_created = usage_counters.articles_created + 1,
        updated_at       = now();

  insert into user_lifetime_usage (user_id, articles_created)
  values (owner_id, 1)
  on conflict (user_id) do update
    set articles_created = user_lifetime_usage.articles_created + 1,
        updated_at       = now();

  return NEW;
end;
$$;

create trigger articles_increment_counter
  after insert on articles
  for each row execute function increment_articles_counter();

-- interviews INSERT 時のカウンター increment
create or replace function increment_interviews_counter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  current_month text;
begin
  select user_id into owner_id from projects where id = NEW.project_id;
  if owner_id is null then
    return NEW;
  end if;

  current_month := jst_month_key(NEW.created_at);

  insert into usage_counters (user_id, month_key, interviews_created)
  values (owner_id, current_month, 1)
  on conflict (user_id, month_key) do update
    set interviews_created = usage_counters.interviews_created + 1,
        updated_at         = now();

  insert into user_lifetime_usage (user_id, interviews_created)
  values (owner_id, 1)
  on conflict (user_id) do update
    set interviews_created = user_lifetime_usage.interviews_created + 1,
        updated_at         = now();

  return NEW;
end;
$$;

create trigger interviews_increment_counter
  after insert on interviews
  for each row execute function increment_interviews_counter();

-- 既存データのバックフィル（冪等）
-- 累計
insert into user_lifetime_usage (user_id, articles_created, interviews_created)
select
  p.user_id,
  coalesce(sum(case when a.id is not null then 1 else 0 end), 0)::int,
  coalesce(sum(case when i.id is not null then 1 else 0 end), 0)::int
from projects p
left join articles   a on a.project_id = p.id
left join interviews i on i.project_id = p.id
group by p.user_id
on conflict (user_id) do update
  set articles_created   = excluded.articles_created,
      interviews_created = excluded.interviews_created,
      updated_at         = now();

-- 月次
insert into usage_counters (user_id, month_key, articles_created, interviews_created)
select
  user_id,
  month_key,
  sum(articles_created)::int,
  sum(interviews_created)::int
from (
  select p.user_id,
         jst_month_key(a.created_at) as month_key,
         1 as articles_created,
         0 as interviews_created
  from articles a
  join projects p on p.id = a.project_id
  union all
  select p.user_id,
         jst_month_key(i.created_at) as month_key,
         0 as articles_created,
         1 as interviews_created
  from interviews i
  join projects p on p.id = i.project_id
) src
group by user_id, month_key
on conflict (user_id, month_key) do update
  set articles_created   = excluded.articles_created,
      interviews_created = excluded.interviews_created,
      updated_at         = now();
