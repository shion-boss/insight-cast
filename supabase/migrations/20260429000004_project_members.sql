-- project_invitations テーブル
CREATE TABLE project_invitations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  accepted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  UNIQUE (project_id, email)
);
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner view invitations" ON project_invitations
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "owner manage invitations" ON project_invitations
  FOR ALL TO authenticated
  USING  (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- project_members テーブル
CREATE TABLE project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
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

-- projects RLS 更新
-- 既存ポリシー: "own projects" (for all, user_id = auth.uid())
-- SELECT: オーナーまたはメンバー
-- INSERT/UPDATE/DELETE: オーナーのみ
DROP POLICY "own projects" ON projects;

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

-- interviews RLS 更新
-- 既存ポリシー: "own interviews"
-- SELECT: オーナーまたはメンバー
-- INSERT: オーナーまたはeditor
DROP POLICY "own interviews" ON interviews;

CREATE POLICY "select interviews" ON interviews
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "insert interviews" ON interviews
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'editor')
  );

CREATE POLICY "update interviews" ON interviews
  FOR UPDATE TO authenticated
  USING  (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "delete interviews" ON interviews
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- interview_messages RLS 更新
-- 既存ポリシー: "own interview_messages"
DROP POLICY "own interview_messages" ON interview_messages;

CREATE POLICY "select interview_messages" ON interview_messages
  FOR SELECT TO authenticated
  USING (
    interview_id IN (
      SELECT i.id FROM interviews i
      JOIN projects p ON p.id = i.project_id
      WHERE p.user_id = auth.uid()
    )
    OR interview_id IN (
      SELECT i.id FROM interviews i
      JOIN project_members pm ON pm.project_id = i.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "insert interview_messages" ON interview_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    interview_id IN (
      SELECT i.id FROM interviews i
      JOIN projects p ON p.id = i.project_id
      WHERE p.user_id = auth.uid()
    )
    OR interview_id IN (
      SELECT i.id FROM interviews i
      JOIN project_members pm ON pm.project_id = i.project_id
      WHERE pm.user_id = auth.uid() AND pm.role = 'editor'
    )
  );

CREATE POLICY "update interview_messages" ON interview_messages
  FOR UPDATE TO authenticated
  USING (
    interview_id IN (
      SELECT i.id FROM interviews i
      JOIN projects p ON p.id = i.project_id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    interview_id IN (
      SELECT i.id FROM interviews i
      JOIN projects p ON p.id = i.project_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "delete interview_messages" ON interview_messages
  FOR DELETE TO authenticated
  USING (
    interview_id IN (
      SELECT i.id FROM interviews i
      JOIN projects p ON p.id = i.project_id
      WHERE p.user_id = auth.uid()
    )
  );

-- articles RLS 更新
-- 既存ポリシー: "own articles"
DROP POLICY "own articles" ON articles;

CREATE POLICY "select articles" ON articles
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "insert articles" ON articles
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'editor')
  );

CREATE POLICY "update articles" ON articles
  FOR UPDATE TO authenticated
  USING  (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "delete articles" ON articles
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
