-- 取材構造（取材の進め方）
--
-- 取材開始時に「時系列で / トピック別で / 対比で / Q&A 形式で / おまかせ」を選べるようにし、
-- AIキャストの取材プロンプトを構造に合わせて分岐させる。
-- omakase（NULL）は既存の挙動と同じく、AIキャストが流れを判断する。

ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS structure text
  CHECK (structure IN ('chronological', 'topical', 'contrast', 'qa', 'omakase'));

COMMENT ON COLUMN public.interviews.structure IS
  '取材の進め方:\n'
  '- chronological: 時系列で（朝から1日の流れ等）\n'
  '- topical: トピック別で（複数の話題を順に）\n'
  '- contrast: 対比で（過去と今・他社と自社など）\n'
  '- qa: Q&A 形式で（読者の疑問に答える形）\n'
  '- omakase: AIキャストが判断（NULL と同義）';
