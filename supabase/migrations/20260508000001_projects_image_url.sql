-- プロジェクト一覧でAIキャストアイコンの代わりに表示するためのプロジェクト画像URL。
-- 自社HPから OGP / favicon を自動取得して保存する。失敗時は null のまま。
alter table projects
  add column if not exists image_url text,
  add column if not exists image_fetched_at timestamptz;

comment on column projects.image_url is 'プロジェクトを識別するための画像URL（OGP image, apple-touch-icon, favicon の順で取得）';
comment on column projects.image_fetched_at is '画像取得を最後に試みた日時。null = 未試行';
