-- ユーザー × 月 × ルート別の集計ビュー
-- サービスロールからのみ参照可（管理用途）
CREATE OR REPLACE VIEW usage_monthly_by_user AS
SELECT
  u.user_id,
  s.plan,
  date_trunc('month', u.created_at) AS month,
  u.route,
  COUNT(*)::integer                 AS call_count,
  SUM(u.input_tokens)::bigint       AS input_tokens,
  SUM(u.output_tokens)::bigint      AS output_tokens,
  SUM(u.cost_usd)                   AS cost_usd
FROM api_usage_logs u
JOIN subscriptions s ON s.user_id = u.user_id
GROUP BY u.user_id, s.plan, date_trunc('month', u.created_at), u.route;

-- プラン × 月別のユーザーあたり平均・最大集計ビュー
CREATE OR REPLACE VIEW usage_monthly_by_plan AS
SELECT
  plan,
  month,
  COUNT(DISTINCT user_id)           AS user_count,
  AVG(cost_usd)                     AS avg_cost_usd,
  MAX(cost_usd)                     AS max_cost_usd,
  AVG(call_count)                   AS avg_calls,
  MAX(call_count)                   AS max_calls,
  SUM(cost_usd)                     AS total_cost_usd
FROM (
  SELECT
    u.user_id,
    s.plan,
    date_trunc('month', u.created_at) AS month,
    SUM(u.cost_usd)                   AS cost_usd,
    COUNT(*)                          AS call_count
  FROM api_usage_logs u
  JOIN subscriptions s ON s.user_id = u.user_id
  GROUP BY u.user_id, s.plan, date_trunc('month', u.created_at)
) sub
GROUP BY plan, month;
