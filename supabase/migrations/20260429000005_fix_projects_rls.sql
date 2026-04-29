-- projects RLS 修正: 前のマイグレーション(20260429000004)が途中で失敗した場合に備えて
-- 全ポリシーを IF EXISTS で安全に削除し、確実に再作成する

-- project_members が存在しない場合は先に作成（べき等）
CREATE TABLE IF NOT EXISTS project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- project_members のポリシーを DROP IF EXISTS してから再作成
DROP POLICY IF EXISTS "view project_members" ON project_members;
DROP POLICY IF EXISTS "owner manage project_members" ON project_members;

CREATE POLICY "view project_members" ON project_members
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "owner manage project_members" ON project_members
  FOR ALL TO authenticated
  USING  (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- projects の全ポリシーを安全に削除してから再作成
DROP POLICY IF EXISTS "own projects" ON projects;
DROP POLICY IF EXISTS "select projects" ON projects;
DROP POLICY IF EXISTS "insert projects" ON projects;
DROP POLICY IF EXISTS "update projects" ON projects;
DROP POLICY IF EXISTS "delete projects" ON projects;

CREATE POLICY "select projects" ON projects
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "insert projects" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update projects" ON projects
  FOR UPDATE TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete projects" ON projects
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
