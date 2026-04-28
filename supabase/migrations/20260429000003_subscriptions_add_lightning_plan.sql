-- subscriptions.plan の CHECK 制約に lightning を追加
-- 注意: 20260428000001_add_lightning_plan.sql で既に適用済みだが、
--       冪等な形（DROP IF EXISTS + ADD）で再定義しているため安全に実行できる。
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'lightning', 'personal', 'business'));
