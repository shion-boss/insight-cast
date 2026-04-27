-- lightning プランを subscriptions.plan の CHECK 制約に追加する
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check
    CHECK (plan IN ('free', 'lightning', 'personal', 'business'));
