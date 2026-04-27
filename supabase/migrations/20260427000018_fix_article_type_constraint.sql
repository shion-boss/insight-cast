-- articles.article_type のチェック制約を実コードの値に合わせて修正する
-- コードでは 'client' / 'interviewer' / 'conversation' を使っているが、
-- 旧マイグレーションの制約は 'normal' / 'interview' のままだった。

ALTER TABLE articles
  DROP CONSTRAINT IF EXISTS articles_article_type_check;

ALTER TABLE articles
  ADD CONSTRAINT articles_article_type_check
  CHECK (article_type IN ('client', 'interviewer', 'conversation'));
