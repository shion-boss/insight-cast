-- 取材リンクのデフォルト使用回数を 2 → 1 に変更。
-- 1リンク=1取材セッションのクリアな仕様にする。再会取材は取材先選択+別リンク発行で実現する。
--
-- 既存レコードは触らない（現に max_use_count=2 で運用されている可能性があるため破壊しない）。
ALTER TABLE external_interview_links
  ALTER COLUMN max_use_count SET DEFAULT 1;
