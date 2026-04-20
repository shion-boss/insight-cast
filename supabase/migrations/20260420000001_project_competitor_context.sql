alter table projects
  add column if not exists industry_memo text,
  add column if not exists location text;
