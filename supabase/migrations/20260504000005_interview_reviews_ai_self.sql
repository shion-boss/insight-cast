-- AI 自己レビューを許可するため reviewer_role の check を拡張
--
-- 取材完了時に AIキャストが自分自身の取材を 4軸（総合・キャラらしさ・問いの質・楽しさ）で
-- 自己採点し、interview_reviews に reviewer_role='ai_self' として保存する。
-- これは character-persona-feedback-loop の症例ソースになる。

ALTER TABLE public.interview_reviews
  DROP CONSTRAINT IF EXISTS interview_reviews_reviewer_role_check;

ALTER TABLE public.interview_reviews
  ADD CONSTRAINT interview_reviews_reviewer_role_check
  CHECK (reviewer_role IN ('owner', 'staff', 'respondent', 'ai_self'));

COMMENT ON COLUMN public.interview_reviews.reviewer_role IS
  '誰がレビューしたか: owner=プロジェクトオーナー, staff=社内スタッフ, respondent=回答者, ai_self=AIキャスト自身（取材完了時に自動生成）';

-- AI 自己レビューは reviewer_user_id が NULL になるので、その状態を許可する
-- （既に nullable なので変更なし）。
