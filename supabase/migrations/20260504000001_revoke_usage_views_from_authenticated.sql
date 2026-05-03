-- usage_monthly_by_user / usage_monthly_by_plan は管理用途（サービスロール専用）。
-- authenticated ロールからのアクセスを明示的に剥奪して警告を解消する。
REVOKE SELECT ON usage_monthly_by_user FROM authenticated, anon;
REVOKE SELECT ON usage_monthly_by_plan  FROM authenticated, anon;
