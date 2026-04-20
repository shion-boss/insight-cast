alter table profiles
  add column if not exists notification_preferences jsonb not null default '{
    "interviewComplete": true,
    "articleReady": true,
    "monthlyReport": false,
    "productUpdates": true
  }'::jsonb;

update profiles
set notification_preferences = coalesce(
  notification_preferences,
  '{
    "interviewComplete": true,
    "articleReady": true,
    "monthlyReport": false,
    "productUpdates": true
  }'::jsonb
)
where notification_preferences is null;
