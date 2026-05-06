-- ブログ記事用の画像 Storage bucket
--
-- admin の記事編集画面から本文中に挿入する画像を保存する。
-- ブログ記事は公開ページから参照されるため、バケットも public にし誰でも読める。
-- 書き込みは server action（service-role）経由のみで行うため、authenticated 向けの
-- INSERT/DELETE ポリシーは設定しない（service-role は RLS をバイパスするので動作する）。
--
-- パス規約: 'posts/<uuid>.<ext>'

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
