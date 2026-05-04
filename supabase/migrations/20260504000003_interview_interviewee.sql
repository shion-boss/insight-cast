-- 取材を受けたユーザーを記録する。
-- owner の他に editor もチームで取材を行うため、project owner = 取材を受けた人とは限らない。
-- 会話記事の「取材先」アイコン・名前のデフォルトに使う。
-- 外部取材リンク経由の取材は NULL のまま（external_respondent_name で扱う）。

ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS interviewee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN interviews.interviewee_user_id IS
  '取材を受けたユーザー（owner または editor）。外部取材の場合は NULL（external_respondent_name を使う）。既存の取材は NULL となり、参照元では project owner にフォールバックする想定。';

CREATE INDEX IF NOT EXISTS interviews_interviewee_user_id_idx
  ON interviews(interviewee_user_id);
