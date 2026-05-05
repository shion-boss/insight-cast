-- 一人称（first_person）を profiles に追加。
-- 記事生成プロンプトに「事業者本人の一人称」を渡すために使う。
-- ユーザーが未設定の場合は NULL のまま。記事側のフォールバックは「私」。
--
-- 値はそのままプロンプトに差し込まれるので、長文にならないよう短い制約をつける。
-- 想定例: 「私」「俺」「僕」「あたし」「わたし」「うち」「弊社」など。

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_person text;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_first_person_length_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_first_person_length_check
  CHECK (first_person IS NULL OR length(first_person) <= 20);
