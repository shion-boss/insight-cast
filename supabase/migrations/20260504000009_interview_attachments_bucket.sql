-- 取材添付画像の Storage bucket
--
-- ハル（Story & People キャスト）の写真起点取材で、事業者がアップロードする画像を保存する。
-- 他のキャストには UI で添付ボタンを出さない（ハルの差別化を維持するため）。
-- バケットは private。アクセスは RLS で制御。
--
-- パス規約: '<project_id>/<interview_id>/<uuid>.<ext>'
-- → storage.foldername(name) = ['<project_id>', '<interview_id>'] になる
-- → (storage.foldername(name))[1] でプロジェクトIDを取り出せる
--
-- 注意: Supabase Cloud では storage.objects に対する直接の DDL は
-- supabase_storage_admin 権限が必要なことがある。
-- このマイグレーションは通常の Studio SQL Editor から実行できるよう
-- storage.foldername() ヘルパーを使った標準パターンで書く。

-- 1. バケット作成（存在しなければ）
INSERT INTO storage.buckets (id, name, public)
VALUES ('interview-attachments', 'interview-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 2. 既存ポリシーがあればクリーンアップ（再適用に備えて）
DROP POLICY IF EXISTS interview_attachments_select ON storage.objects;
DROP POLICY IF EXISTS interview_attachments_insert ON storage.objects;
DROP POLICY IF EXISTS interview_attachments_delete ON storage.objects;

-- 3. SELECT ポリシー: バケット内の画像をプロジェクトオーナー or メンバー（editor/viewer）が読める
CREATE POLICY interview_attachments_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'interview-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id::text = (storage.foldername(name))[1]
          AND p.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id::text = (storage.foldername(name))[1]
          AND pm.user_id = auth.uid()
          AND pm.role IN ('editor', 'viewer')
      )
    )
  );

-- 4. INSERT ポリシー: オーナー or editor がアップロードできる（viewer はダメ）
CREATE POLICY interview_attachments_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'interview-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id::text = (storage.foldername(name))[1]
          AND p.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id::text = (storage.foldername(name))[1]
          AND pm.user_id = auth.uid()
          AND pm.role = 'editor'
      )
    )
  );

-- 5. DELETE ポリシー: プロジェクトオーナーのみ
CREATE POLICY interview_attachments_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'interview-attachments'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
    )
  );
