-- 取材レビューの一本化制約を分割し、AI 自己採点とユーザーレビューを同テーブル内で共存させる。
--
-- これまでは unique (interview_id) で「1 取材 1 レビュー」を強制していたため、AI 自己採点と
-- ユーザー本人のレビューが両立できず、summarize 側で ignoreDuplicates フラグを使って
-- ユーザー入力を優先していた。新仕様では両方を症例ソースとして残したいため、
-- partial unique index に分割する。
--
-- あわせて、取材本人（interviewee_user_id）が自分の取材に対して reviewer_role='respondent'
-- としてレビューを書けるように、RLS の INSERT/UPDATE ポリシーを追加する。

-- 既存の unique (interview_id) 制約を撤去
ALTER TABLE public.interview_reviews
  DROP CONSTRAINT IF EXISTS interview_reviews_interview_id_key;

-- AI 自己採点は 1 取材 1 件
CREATE UNIQUE INDEX IF NOT EXISTS interview_reviews_ai_self_unique
  ON public.interview_reviews (interview_id)
  WHERE reviewer_role = 'ai_self';

-- ユーザーレビュー（owner / staff / respondent）も 1 取材 1 件
CREATE UNIQUE INDEX IF NOT EXISTS interview_reviews_human_unique
  ON public.interview_reviews (interview_id)
  WHERE reviewer_role IN ('owner', 'staff', 'respondent');

-- 取材本人による INSERT を許可（reviewer_role='respondent' のときに限る）
DROP POLICY IF EXISTS interview_reviews_insert_respondent ON public.interview_reviews;
CREATE POLICY interview_reviews_insert_respondent ON public.interview_reviews
  FOR INSERT
  WITH CHECK (
    reviewer_role = 'respondent'
    AND reviewer_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.interviews i
      WHERE i.id = interview_reviews.interview_id
        AND i.interviewee_user_id = auth.uid()
    )
  );

-- 取材本人による UPDATE を許可（自分が書いたユーザーレビュー行のみ）
DROP POLICY IF EXISTS interview_reviews_update_respondent ON public.interview_reviews;
CREATE POLICY interview_reviews_update_respondent ON public.interview_reviews
  FOR UPDATE
  USING (
    reviewer_role = 'respondent'
    AND reviewer_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.interviews i
      WHERE i.id = interview_reviews.interview_id
        AND i.interviewee_user_id = auth.uid()
    )
  )
  WITH CHECK (
    reviewer_role = 'respondent'
    AND reviewer_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.interviews i
      WHERE i.id = interview_reviews.interview_id
        AND i.interviewee_user_id = auth.uid()
    )
  );

COMMENT ON INDEX public.interview_reviews_ai_self_unique IS
  'AI 自己採点は 1 取材 1 件。reviewer_role=ai_self のレコードに対する partial unique。';
COMMENT ON INDEX public.interview_reviews_human_unique IS
  'ユーザーレビュー（owner/staff/respondent）は 1 取材 1 件。AI 採点とは別レコードで共存する。';
