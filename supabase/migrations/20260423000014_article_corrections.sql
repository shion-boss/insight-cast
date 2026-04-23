-- 記事修正ログ（AIの学習データ）
CREATE TABLE article_corrections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id   UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  original     TEXT NOT NULL,
  corrected    TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE article_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON article_corrections
  USING (
    EXISTS (
      SELECT 1 FROM articles a
      JOIN projects p ON p.id = a.project_id
      WHERE a.id = article_corrections.article_id
        AND p.user_id = auth.uid()
    )
  );
