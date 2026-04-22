-- オンボーディングフロー廃止。新規ユーザーはデフォルトで onboarded = true にする
ALTER TABLE profiles ALTER COLUMN onboarded SET DEFAULT true;
UPDATE profiles SET onboarded = true WHERE onboarded IS NULL OR onboarded = false;
