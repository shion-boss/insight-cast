create table public.cast_talk_reviews (
  id uuid primary key default gen_random_uuid(),
  cast_talk_id uuid not null references public.cast_talks(id) on delete cascade,
  -- 1=とても悪い / 3=普通 / 5=とても良い
  overall_score smallint not null check (overall_score between 1 and 5),
  naturalness_score smallint check (naturalness_score between 1 and 5),
  character_score smallint check (character_score between 1 and 5),
  good_points text,
  improve_points text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cast_talk_id)
);

-- 管理者のみ操作可能（service_role は RLS をバイパス）
alter table public.cast_talk_reviews enable row level security;

create trigger cast_talk_reviews_updated_at
  before update on public.cast_talk_reviews
  for each row execute function public.set_updated_at();
