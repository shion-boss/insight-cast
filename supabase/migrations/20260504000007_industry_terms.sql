-- 業種用語辞書
--
-- 取材中に出てきた業界用語を抽出して project 単位で蓄積する。
-- 次回以降の取材で AIキャストに「この事業者の業界ではこういう用語がある」と
-- 渡すことで、専門語の取り違えを減らし、事業者の語彙に追従しやすくする。

CREATE TABLE IF NOT EXISTS public.industry_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  term text NOT NULL,
  meaning text,                                  -- AI が要約した意味（NULL 可）
  first_seen_in_interview_id uuid REFERENCES public.interviews(id) ON DELETE SET NULL,
  seen_count int NOT NULL DEFAULT 1,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, term)
);

CREATE INDEX IF NOT EXISTS industry_terms_project_idx
  ON public.industry_terms (project_id);
CREATE INDEX IF NOT EXISTS industry_terms_seen_count_idx
  ON public.industry_terms (project_id, seen_count DESC);

ALTER TABLE public.industry_terms ENABLE ROW LEVEL SECURITY;

-- ポリシー: プロジェクトのオーナーまたはメンバーが読める
CREATE POLICY industry_terms_select ON public.industry_terms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = industry_terms.project_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
              AND pm.role IN ('editor', 'viewer')
          )
        )
    )
  );

COMMENT ON TABLE public.industry_terms IS
  'プロジェクトごとの業界用語辞書。取材完了時に AI が抽出する。';
COMMENT ON COLUMN public.industry_terms.term IS '抽出された用語。事業者本人が会話の中で実際に使ったもののみ';
COMMENT ON COLUMN public.industry_terms.meaning IS 'AI が要約した意味（取材文脈から推測。一般辞書ではない）';
COMMENT ON COLUMN public.industry_terms.seen_count IS 'この用語が出現した取材数';
