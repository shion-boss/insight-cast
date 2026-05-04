-- 取材添付画像の Storage bucket
--
-- ハル（Story & People キャスト）の写真起点取材で、事業者がアップロードする画像を保存する。
-- 他のキャストには UI で添付ボタンを出さない（ハルの差別化を維持するため）。
-- バケットは private。アクセスは RLS で制御。

INSERT INTO storage.buckets (id, name, public)
VALUES ('interview-attachments', 'interview-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ポリシー: プロジェクトのオーナーまたは editor メンバーがアップロード・参照できる。
-- パス規約: {project_id}/{interview_id}/{uuid}.{ext}

DROP POLICY IF EXISTS interview_attachments_select ON storage.objects;
DROP POLICY IF EXISTS interview_attachments_insert ON storage.objects;
DROP POLICY IF EXISTS interview_attachments_delete ON storage.objects;

-- SELECT: バケット内の画像をプロジェクトオーナー or メンバー（editor/viewer）が読める
CREATE POLICY interview_attachments_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'interview-attachments'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = split_part(name, '/', 1)
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

-- INSERT: オーナー or editor がアップロードできる（viewer はダメ）
CREATE POLICY interview_attachments_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'interview-attachments'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = split_part(name, '/', 1)
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
              AND pm.role = 'editor'
          )
        )
    )
  );

-- DELETE: オーナーのみ
CREATE POLICY interview_attachments_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'interview-attachments'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = split_part(name, '/', 1)
        AND p.user_id = auth.uid()
    )
  );

COMMENT ON POLICY interview_attachments_select ON storage.objects IS
  '取材添付画像: プロジェクトのオーナー or メンバーが参照可';
