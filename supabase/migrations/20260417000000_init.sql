-- 顧客HP
create table clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  url        text not null,
  industry_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- HP分析結果
create table site_analyses (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references clients (id) on delete cascade,
  raw_content      text,
  analysis_result  jsonb,
  created_at       timestamptz not null default now()
);

-- 競合分析結果
create table competitor_analyses (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references clients (id) on delete cascade,
  competitor_urls  text[],
  analysis_result  jsonb,
  created_at       timestamptz not null default now()
);

-- インタビューセッション
create table interview_sessions (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients (id) on delete cascade,
  character_id text not null,
  status       text not null default 'active' check (status in ('active', 'completed')),
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- インタビュー発言
create table interview_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references interview_sessions (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

-- 記事・素材
create table articles (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients (id) on delete cascade,
  session_id uuid references interview_sessions (id) on delete set null,
  status     text not null default 'draft' check (status in ('draft', 'published')),
  themes     jsonb,
  materials  jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 自動更新
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

create trigger articles_updated_at
  before update on articles
  for each row execute function update_updated_at();

-- RLS 有効化（Phase 1 は内部ツールのため全テーブル認証済みユーザーのみ許可）
alter table clients             enable row level security;
alter table site_analyses       enable row level security;
alter table competitor_analyses enable row level security;
alter table interview_sessions  enable row level security;
alter table interview_messages  enable row level security;
alter table articles            enable row level security;

create policy "authenticated users only" on clients
  for all to authenticated using (true) with check (true);

create policy "authenticated users only" on site_analyses
  for all to authenticated using (true) with check (true);

create policy "authenticated users only" on competitor_analyses
  for all to authenticated using (true) with check (true);

create policy "authenticated users only" on interview_sessions
  for all to authenticated using (true) with check (true);

create policy "authenticated users only" on interview_messages
  for all to authenticated using (true) with check (true);

create policy "authenticated users only" on articles
  for all to authenticated using (true) with check (true);
