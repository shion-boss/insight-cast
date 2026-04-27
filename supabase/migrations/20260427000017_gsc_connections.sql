create table gsc_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  site_url text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  unique(project_id)
);
alter table gsc_connections enable row level security;
create policy "users can manage own gsc_connections"
  on gsc_connections for all using (auth.uid() = user_id);
