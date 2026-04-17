-- HP分析結果
create table hp_audits (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects (id) on delete cascade,
  current_content  text[],
  strengths        text[],
  gaps             text[],
  suggested_themes text[],
  raw_data         jsonb,
  created_at       timestamptz not null default now()
);

-- 競合比較結果
create table competitor_analyses (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects (id) on delete cascade,
  competitor_id uuid not null references competitors (id) on delete cascade,
  gaps          text[],
  advantages    text[],
  raw_data      jsonb,
  created_at    timestamptz not null default now()
);

-- RLS
alter table hp_audits            enable row level security;
alter table competitor_analyses  enable row level security;

create policy "own hp_audits" on hp_audits
  for all to authenticated
  using  (project_id in (select id from projects where user_id = auth.uid()))
  with check (project_id in (select id from projects where user_id = auth.uid()));

create policy "own competitor_analyses" on competitor_analyses
  for all to authenticated
  using  (project_id in (select id from projects where user_id = auth.uid()))
  with check (project_id in (select id from projects where user_id = auth.uid()));
