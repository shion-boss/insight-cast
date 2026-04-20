alter table profiles
  add column if not exists plan text not null default 'individual'
    check (plan in ('individual', 'business'));
