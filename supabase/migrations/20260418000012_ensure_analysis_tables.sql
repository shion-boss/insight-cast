create table if not exists hp_audits (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects (id) on delete cascade,
  current_content  text[],
  strengths        text[],
  gaps             text[],
  suggested_themes text[],
  raw_data         jsonb,
  created_at       timestamptz not null default now()
);

alter table hp_audits
  add column if not exists current_content text[],
  add column if not exists strengths text[],
  add column if not exists gaps text[],
  add column if not exists suggested_themes text[],
  add column if not exists raw_data jsonb,
  add column if not exists created_at timestamptz not null default now();

alter table hp_audits enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'hp_audits'
      and policyname = 'own hp_audits'
  ) then
    execute $policy$
      create policy "own hp_audits" on hp_audits
        for all to authenticated
        using  (project_id in (select id from projects where user_id = auth.uid()))
        with check (project_id in (select id from projects where user_id = auth.uid()))
    $policy$;
  end if;
end
$$;
