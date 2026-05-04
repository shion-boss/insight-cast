-- 取材メッセージのメタデータ（発見の合図など）
--
-- AIキャストが取材中に「これは記事化に効きそう」と判定した瞬間を記録する。
-- 取材完了後の要約・記事化UIでハイライトされる予定（UI は次フェーズ）。

ALTER TABLE interview_messages
  ADD COLUMN IF NOT EXISTS meta jsonb;

COMMENT ON COLUMN interview_messages.meta IS
  'メッセージのメタデータ（{ discovery: { reason: string } } 等）。AIキャストが [DISCOVERY: 短い理由] マーカーで発見の合図を出した時に記録される。';

-- 発見済みメッセージのみを高速に拾うインデックス
CREATE INDEX IF NOT EXISTS interview_messages_discovery_idx
  ON interview_messages ((meta->'discovery'))
  WHERE meta->'discovery' IS NOT NULL;
