create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  category text not null default 'insight-cast',
  type text not null default 'normal',       -- 'normal' | 'interview'
  interviewer text,                           -- character id
  cover_color text not null default 'bg-gradient-to-br from-stone-200 to-stone-300',
  date date not null default current_date,
  published boolean not null default false,
  body jsonb,                                 -- article body (ArticleBody形式)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at を自動更新するトリガー
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function update_updated_at_column();

-- RLS: 公開記事は誰でも読める。書き込みはservice_role（サーバーサイドのみ）
alter table blog_posts enable row level security;

create policy "public can read published posts" on blog_posts
  for select using (published = true);
