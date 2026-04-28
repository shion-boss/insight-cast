alter table articles
  add column if not exists suggestions jsonb;
