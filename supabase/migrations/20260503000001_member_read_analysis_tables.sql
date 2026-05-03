-- hp_audits / competitors / competitor_analyses の SELECT を
-- プロジェクトメンバーにも解放する。
-- 書き込み（INSERT/UPDATE/DELETE）はオーナーのみのまま。

-- ── hp_audits ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own hp_audits" ON hp_audits;

CREATE POLICY "select hp_audits" ON hp_audits
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "insert hp_audits" ON hp_audits
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "update hp_audits" ON hp_audits
  FOR UPDATE TO authenticated
  USING  (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "delete hp_audits" ON hp_audits
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ── competitors ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own competitors" ON competitors;

CREATE POLICY "select competitors" ON competitors
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "insert competitors" ON competitors
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "update competitors" ON competitors
  FOR UPDATE TO authenticated
  USING  (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "delete competitors" ON competitors
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ── competitor_analyses ────────────────────────────────────────────
DROP POLICY IF EXISTS "own competitor_analyses" ON competitor_analyses;

CREATE POLICY "select competitor_analyses" ON competitor_analyses
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "insert competitor_analyses" ON competitor_analyses
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "update competitor_analyses" ON competitor_analyses
  FOR UPDATE TO authenticated
  USING  (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "delete competitor_analyses" ON competitor_analyses
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
