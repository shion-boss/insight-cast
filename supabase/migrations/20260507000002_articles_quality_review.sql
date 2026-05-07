-- 記事品質ログ（quality_review）と読者像（audience）の保存先を追加。
--
-- quality_review:
--   生成直後の決定的セルフチェック（正規表現）と AI軽量セルフ採点（Haiku）を
--   同じカラムに JSON として保存する。スキーマは
--   `docs/review-log/article-evaluation.md` 8節を参照。
--
--   {
--     "deterministic": {
--       "perspective_violations": [...],
--       "first_person_mixed": { "dominant": "...", "others": [...] } | null,
--       "title_length": 24,
--       "char_count": 1380,
--       "volume_range": { "min": 1200, "max": 1500, "ok": true },
--       "abstract_density": 0.18,
--       "h1_count": 1,
--       "h2_count": 3
--     },
--     "ai_self": {
--       "scores": { ... 10軸 ... },
--       "total": 24,
--       "total_max": 30,
--       "weakest_axes": ["cta"],
--       "comment": "..."
--     } | null
--   }
--
-- audience:
--   想定読者層。記事生成時にプロンプトへ注入し、語り口を読者に合わせる。
--   new=新規見込み客 / existing=既存顧客 / considering=検討中 / peer=同業者
--   未指定（NULL）の場合は new として扱う。

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS quality_review jsonb;

COMMENT ON COLUMN public.articles.quality_review IS
  '生成直後の品質チェック結果（決定的チェック + AI軽量セルフ採点）。詳細は docs/review-log/article-evaluation.md を参照';

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS audience text;

ALTER TABLE public.articles
  DROP CONSTRAINT IF EXISTS articles_audience_check;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_audience_check
  CHECK (audience IS NULL OR audience IN ('new', 'existing', 'considering', 'peer'));

COMMENT ON COLUMN public.articles.audience IS
  '想定読者層。new=新規見込み客 / existing=既存顧客 / considering=検討中 / peer=同業者。NULL は new として扱う';
