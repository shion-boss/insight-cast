-- cast_talk_edits テーブル
-- Cast Talk 編集フィードバック学習機能
-- キャスト単位で「こういう言い回しを避ける」をfew-shotとして蓄積する
--
-- 実行方法: Supabaseダッシュボード > SQL Editor に貼り付けて実行

create table cast_talk_edits (
  id uuid primary key default gen_random_uuid(),
  cast_talk_id uuid references cast_talks(id) on delete cascade,
  cast_id text not null, -- 'mint' | 'claus' | 'rain'
  original_text text not null,
  edited_text text not null,
  created_at timestamptz default now()
);

-- インデックス: キャスト別の取得クエリを高速化
create index cast_talk_edits_cast_id_created_at_idx
  on cast_talk_edits (cast_id, created_at desc);

-- インデックス: cast_talk_id からの削除カスケードを高速化
create index cast_talk_edits_cast_talk_id_idx
  on cast_talk_edits (cast_talk_id);

-- RLS: このテーブルは管理者のみ読み書きする（adminクライアント経由）
-- Row Level Security は一旦無効にし、adminクライアントのservice_roleで操作する
alter table cast_talk_edits enable row level security;
