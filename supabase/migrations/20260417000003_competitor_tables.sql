-- profiles から competitor_urls を削除
alter table profiles drop column if exists competitor_urls;

-- 競合サイト管理テーブル
create table competitor_sites (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  url           text not null,
  name          text,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

-- HP分析結果
create table site_analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  result      jsonb not null,
  analyzed_at timestamptz not null default now()
);

-- 競合比較分析結果
create table competitor_analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  result      jsonb not null,
  analyzed_at timestamptz not null default now()
);

-- RLS
alter table competitor_sites     enable row level security;
alter table site_analyses        enable row level security;
alter table competitor_analyses  enable row level security;

create policy "own competitor_sites" on competitor_sites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own site_analyses" on site_analyses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own competitor_analyses" on competitor_analyses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
