-- user_id に UNIQUE 制約を追加（ON CONFLICT (user_id) を使えるようにする）
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);

-- stripe_customer_id に UNIQUE 制約を追加
-- NULL は複数あっても許容される（PostgreSQL の仕様）
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_stripe_customer_id_unique UNIQUE (stripe_customer_id);

-- 既存ユーザーに free プランレコードを補完
INSERT INTO subscriptions (user_id, plan, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM subscriptions);
