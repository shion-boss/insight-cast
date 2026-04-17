-- プロフィールにアカウントレベルの競合・調査データを追加
alter table profiles
  add column if not exists competitor_urls    text[]      default '{}',
  add column if not exists hp_audit_result    jsonb,
  add column if not exists competitor_audit_result jsonb,
  add column if not exists audit_updated_at   timestamptz;
