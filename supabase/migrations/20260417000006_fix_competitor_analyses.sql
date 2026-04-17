-- migration 003 で作成された旧スキーマ（user_id/result）を新スキーマに置き換える
drop table if exists competitor_analyses cascade;

create table competitor_analyses (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects (id) on delete cascade,
  competitor_id uuid not null references competitors (id) on delete cascade,
  gaps          text[],
  advantages    text[],
  raw_data      jsonb,
  created_at    timestamptz not null default now()
);

alter table competitor_analyses enable row level security;

create policy "own competitor_analyses" on competitor_analyses
  for all to authenticated
  using  (project_id in (select id from projects where user_id = auth.uid()))
  with check (project_id in (select id from projects where user_id = auth.uid()));
