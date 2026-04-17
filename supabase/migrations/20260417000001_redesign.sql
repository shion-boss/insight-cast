-- 既存テーブルを削除
drop table if exists articles cascade;
drop table if exists interview_messages cascade;
drop table if exists interview_sessions cascade;
drop table if exists competitor_analyses cascade;
drop table if exists site_analyses cascade;
drop table if exists clients cascade;

-- ユーザープロフィール（auth.users に1対1）
create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text,
  url           text,
  industry_memo text,
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- インタビューセッション
create table interview_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  character_id text not null,
  type         text not null default 'interview' check (type in ('onboarding', 'interview')),
  status       text not null default 'active' check (status in ('active', 'completed')),
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- インタビュー会話ログ
create table interview_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references interview_sessions (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

-- 出力物（type は自由拡張）
create table interview_outputs (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references interview_sessions (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null,
  title      text not null,
  content    text not null,
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

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- 新規ユーザー登録時に profiles を自動作成
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table profiles           enable row level security;
alter table interview_sessions enable row level security;
alter table interview_messages enable row level security;
alter table interview_outputs  enable row level security;

create policy "own profile" on profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "own sessions" on interview_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own messages" on interview_messages
  for all to authenticated using (
    session_id in (select id from interview_sessions where user_id = auth.uid())
  );

create policy "own outputs" on interview_outputs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
