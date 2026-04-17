-- プロジェクト
create table projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text,
  hp_url     text not null,
  status     text not null default 'analyzing'
             check (status in ('analyzing','report_ready','interview_ready','interview_done','article_ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 競合URL（プロジェクト紐付け）
create table competitors (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  url        text not null,
  created_at timestamptz not null default now()
);

-- updated_at 自動更新
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- RLS
alter table projects   enable row level security;
alter table competitors enable row level security;

create policy "own projects" on projects
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own competitors" on competitors
  for all to authenticated
  using  (project_id in (select id from projects where user_id = auth.uid()))
  with check (project_id in (select id from projects where user_id = auth.uid()));
