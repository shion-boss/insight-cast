create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  business text,
  message text not null,
  created_at timestamptz default now()
);
