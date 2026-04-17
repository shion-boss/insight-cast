-- インタビューセッション（project紐付け）
create table interviews (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects (id) on delete cascade,
  interviewer_type text not null check (interviewer_type in ('mint','claus','rain')),
  status           text not null default 'in_progress'
                   check (status in ('in_progress','completed')),
  summary          text,
  themes           text[],
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger interviews_updated_at
  before update on interviews
  for each row execute function update_updated_at();

-- インタビューメッセージ（interview紐付け）
-- 旧テーブル (session_id参照) を置き換え
drop table if exists interview_messages cascade;

create table interview_messages (
  id           uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews (id) on delete cascade,
  role         text not null check (role in ('user','interviewer')),
  content      text not null,
  created_at   timestamptz not null default now()
);

-- 生成記事
create table articles (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects (id) on delete cascade,
  interview_id uuid references interviews (id) on delete set null,
  article_type text not null check (article_type in ('normal','interview')),
  title        text,
  content      text not null,
  created_at   timestamptz not null default now()
);

-- RLS
alter table interviews        enable row level security;
alter table interview_messages enable row level security;
alter table articles          enable row level security;

create policy "own interviews" on interviews
  for all to authenticated
  using  (project_id in (select id from projects where user_id = auth.uid()))
  with check (project_id in (select id from projects where user_id = auth.uid()));

create policy "own interview_messages" on interview_messages
  for all to authenticated
  using  (interview_id in (
    select i.id from interviews i
    join projects p on p.id = i.project_id
    where p.user_id = auth.uid()
  ))
  with check (interview_id in (
    select i.id from interviews i
    join projects p on p.id = i.project_id
    where p.user_id = auth.uid()
  ));

create policy "own articles" on articles
  for all to authenticated
  using  (project_id in (select id from projects where user_id = auth.uid()))
  with check (project_id in (select id from projects where user_id = auth.uid()));
