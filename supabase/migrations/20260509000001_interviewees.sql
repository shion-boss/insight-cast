-- interviewees テーブル: プロジェクト単位の取材先（人物）
-- 法人プランの外部取材リンクで「同じ人に複数回取材」を実現するための土台。
-- 個人プランでも将来的に役立つよう、プロジェクト全体で共有できる形にしておく。
--
-- 既存データ:
--   - interviews.interviewee_user_id がある（owner/editor が自分で答えた取材）
--     → profiles から名前を取って interviewees レコードを作り、紐付ける
--   - interviews.external_respondent_name がある（外部取材リンク経由）
--     → (project_id, name) ユニークで interviewees レコードを作り、紐付ける
--   - external_respondent_name は表示キャッシュとして残す（破壊しない）

CREATE TABLE interviewees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  industry        TEXT,
  role            TEXT,
  notes           TEXT,
  -- プロジェクトメンバー（auth.users）と紐付く場合のみ。外部取材リンクの相手は NULL。
  linked_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- 同じプロジェクト内で同名の取材先を重複登録できないよう、ソフトデリートを除いてユニーク
CREATE UNIQUE INDEX interviewees_project_name_unique
  ON interviewees(project_id, name)
  WHERE deleted_at IS NULL;

CREATE INDEX interviewees_project_id_idx
  ON interviewees(project_id)
  WHERE deleted_at IS NULL;

CREATE INDEX interviewees_linked_user_id_idx
  ON interviewees(linked_user_id)
  WHERE linked_user_id IS NOT NULL AND deleted_at IS NULL;

-- updated_at 自動更新
CREATE OR REPLACE FUNCTION interviewees_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interviewees_set_updated_at_trigger
  BEFORE UPDATE ON interviewees
  FOR EACH ROW EXECUTE FUNCTION interviewees_set_updated_at();

-- RLS
ALTER TABLE interviewees ENABLE ROW LEVEL SECURITY;

-- SELECT: プロジェクトのオーナーまたはメンバー（viewer 含む）
CREATE POLICY "select interviewees" ON interviewees
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- INSERT: オーナーまたは editor
CREATE POLICY "insert interviewees" ON interviewees
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'editor')
  );

-- UPDATE: オーナーまたは editor
CREATE POLICY "update interviewees" ON interviewees
  FOR UPDATE TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'editor')
  )
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'editor')
  );

-- DELETE: オーナーのみ（ソフトデリート用 UPDATE は editor も可）
CREATE POLICY "delete interviewees" ON interviewees
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────────
-- interviews.interviewee_id カラム追加
-- ─────────────────────────────────────────────
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS interviewee_id UUID REFERENCES interviewees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS interviews_interviewee_id_idx
  ON interviews(interviewee_id)
  WHERE interviewee_id IS NOT NULL;

-- ─────────────────────────────────────────────
-- バックフィル
-- ─────────────────────────────────────────────

-- 1) 内部取材（interviewee_user_id あり）→ profiles から名前を取って interviewees 作成
INSERT INTO interviewees (project_id, name, linked_user_id, created_at)
SELECT
  i.project_id,
  COALESCE(p.name, 'メンバー') AS name,
  i.interviewee_user_id,
  MIN(i.created_at) AS created_at
FROM interviews i
LEFT JOIN profiles p ON p.id = i.interviewee_user_id
WHERE i.interviewee_user_id IS NOT NULL
  AND i.deleted_at IS NULL
GROUP BY i.project_id, i.interviewee_user_id, COALESCE(p.name, 'メンバー')
ON CONFLICT (project_id, name) WHERE deleted_at IS NULL DO NOTHING;

-- 2) 外部取材（external_respondent_name あり）→ (project_id, name) で interviewees 作成
INSERT INTO interviewees (project_id, name, industry, created_at)
SELECT
  i.project_id,
  i.external_respondent_name,
  -- 同じ name で industry が複数あれば最新のを採用（雑だが backfill としては許容）
  (ARRAY_AGG(i.external_respondent_industry ORDER BY i.created_at DESC))[1],
  MIN(i.created_at) AS created_at
FROM interviews i
WHERE i.external_respondent_name IS NOT NULL
  AND TRIM(i.external_respondent_name) <> ''
  AND i.deleted_at IS NULL
GROUP BY i.project_id, i.external_respondent_name
ON CONFLICT (project_id, name) WHERE deleted_at IS NULL DO NOTHING;

-- 3) interviews.interviewee_id を埋める
UPDATE interviews i
SET interviewee_id = ie.id
FROM interviewees ie
WHERE i.interviewee_user_id IS NOT NULL
  AND ie.project_id = i.project_id
  AND ie.linked_user_id = i.interviewee_user_id
  AND ie.deleted_at IS NULL
  AND i.interviewee_id IS NULL
  AND i.deleted_at IS NULL;

UPDATE interviews i
SET interviewee_id = ie.id
FROM interviewees ie
WHERE i.external_respondent_name IS NOT NULL
  AND TRIM(i.external_respondent_name) <> ''
  AND ie.project_id = i.project_id
  AND ie.name = i.external_respondent_name
  AND ie.deleted_at IS NULL
  AND i.interviewee_id IS NULL
  AND i.deleted_at IS NULL;

-- ─────────────────────────────────────────────
-- external_interview_links.interviewee_id 追加
-- ─────────────────────────────────────────────
ALTER TABLE external_interview_links
  ADD COLUMN IF NOT EXISTS interviewee_id UUID REFERENCES interviewees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS external_interview_links_interviewee_id_idx
  ON external_interview_links(interviewee_id)
  WHERE interviewee_id IS NOT NULL;

-- 既存リンクの target_name から interviewee 紐付け
UPDATE external_interview_links l
SET interviewee_id = ie.id
FROM interviewees ie
WHERE l.target_name IS NOT NULL
  AND TRIM(l.target_name) <> ''
  AND ie.project_id = l.project_id
  AND ie.name = l.target_name
  AND ie.deleted_at IS NULL
  AND l.interviewee_id IS NULL;

COMMENT ON TABLE interviewees IS 'プロジェクト単位の取材先（人物）。法人プランの外部取材リンクで再会判定を可能にする土台。';
COMMENT ON COLUMN interviewees.linked_user_id IS 'プロジェクトメンバー（auth.users）と紐付く場合のみ設定。外部取材リンク経由の相手は NULL。';
COMMENT ON COLUMN interviews.interviewee_id IS '取材先（interviewees）への参照。external_respondent_name は表示キャッシュとして残す。';
COMMENT ON COLUMN external_interview_links.interviewee_id IS '取材先（interviewees）への参照。target_name は表示キャッシュとして残す。';
