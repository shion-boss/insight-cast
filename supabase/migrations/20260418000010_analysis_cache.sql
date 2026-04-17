-- 競合候補のAI提案を再利用できるようにキャッシュ保存する
create table if not exists competitor_suggestion_caches (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  source_url      text not null,
  industry        text not null,
  location        text,
  input_signature text not null,
  suggestions     jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists competitor_suggestion_caches_user_signature_idx
  on competitor_suggestion_caches (user_id, input_signature);

drop trigger if exists competitor_suggestion_caches_updated_at on competitor_suggestion_caches;

create trigger competitor_suggestion_caches_updated_at
  before update on competitor_suggestion_caches
  for each row execute function update_updated_at();

alter table competitor_suggestion_caches enable row level security;

create policy "own competitor_suggestion_caches" on competitor_suggestion_caches
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
