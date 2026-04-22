create table public.cast_talks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  theme text not null,
  format text not null check (format in ('interview', 'dialogue')),
  interviewer_id text not null,  -- cast id (mint/claus/rain)
  guest_id text not null,
  messages jsonb not null default '[]',  -- Array<{castId, text}>
  summary text,
  slug text unique not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: 公開済みは誰でも読める、draft はservice_roleのみ
alter table public.cast_talks enable row level security;

create policy "cast_talks: published are public"
  on public.cast_talks for select
  using (status = 'published');

-- updated_at を自動更新するトリガー
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cast_talks_updated_at
  before update on public.cast_talks
  for each row execute function public.set_updated_at();
