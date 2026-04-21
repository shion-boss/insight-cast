create table if not exists api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  route text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10, 6) not null default 0
);

create index api_usage_logs_created_at_idx on api_usage_logs (created_at desc);
create index api_usage_logs_user_id_idx on api_usage_logs (user_id);

alter table api_usage_logs enable row level security;

-- 管理者のみ読み取り可（service_role経由で書き込み）
