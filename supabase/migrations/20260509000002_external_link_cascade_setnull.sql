-- 取材リンクを削除しても、過去の取材レコードは残せるよう FK を SET NULL に変更。
-- 削除されたリンク経由の取材は external_link_id = NULL になるが、
-- external_respondent_name / interviewee_id / 取材本文は保持される。

ALTER TABLE interviews
  DROP CONSTRAINT IF EXISTS interviews_external_link_id_fkey;

ALTER TABLE interviews
  ADD CONSTRAINT interviews_external_link_id_fkey
  FOREIGN KEY (external_link_id)
  REFERENCES external_interview_links(id)
  ON DELETE SET NULL;

-- 無効化＝削除に方針変更したので、既存の is_active=false リンクは一括削除。
-- 関連する interviews.external_link_id は SET NULL で抜ける。
DELETE FROM external_interview_links WHERE is_active = FALSE;
