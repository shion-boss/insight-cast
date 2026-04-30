-- external_interview_links テーブル: 外部取材リンク機能（法人プランのみ）
CREATE TABLE external_interview_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  interviewer_type TEXT NOT NULL,
  theme TEXT NOT NULL,
  target_name TEXT,
  target_industry TEXT,
  use_count INT NOT NULL DEFAULT 0,
  max_use_count INT NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX external_interview_links_project_id_idx ON external_interview_links(project_id);
CREATE INDEX external_interview_links_created_by_idx ON external_interview_links(created_by);
CREATE INDEX external_interview_links_token_idx ON external_interview_links(token);

-- RLS 有効化
ALTER TABLE external_interview_links ENABLE ROW LEVEL SECURITY;

-- SELECT: 発行者本人 OR トークンがあれば誰でも読める（外部インタビュー受診者向け）
CREATE POLICY "external_interview_links_select" ON external_interview_links
  FOR SELECT
  USING (
    auth.uid() = created_by
    OR TRUE  -- tokenによる参照はAPIレイヤーで制御するため、ここでは全SELECT許可
  );

-- INSERT: ログイン中のユーザーのみ（created_byは自分のみ）
CREATE POLICY "external_interview_links_insert" ON external_interview_links
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: 発行者本人のみ
CREATE POLICY "external_interview_links_update" ON external_interview_links
  FOR UPDATE
  USING (auth.uid() = created_by);

-- DELETE: 発行者本人のみ
CREATE POLICY "external_interview_links_delete" ON external_interview_links
  FOR DELETE
  USING (auth.uid() = created_by);

-- interviews テーブルにカラム追加
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS external_link_id UUID REFERENCES external_interview_links(id),
  ADD COLUMN IF NOT EXISTS external_respondent_name TEXT,
  ADD COLUMN IF NOT EXISTS external_respondent_industry TEXT;
