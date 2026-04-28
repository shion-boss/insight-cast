-- blog_posts に Insight Cast 取材メタデータを追加
-- interview_duration_min: 取材にかかった時間（分）
-- interview_question_count: 質問数
alter table blog_posts
  add column if not exists interview_duration_min integer,
  add column if not exists interview_question_count integer;
