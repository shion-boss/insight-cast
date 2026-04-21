alter table projects
  drop constraint if exists projects_status_check;

alter table projects
  add constraint projects_status_check
  check (status in (
    'analysis_pending',
    'analyzing',
    'report_ready',
    'interview_ready',
    'interview_done',
    'article_generating',
    'article_ready'
  ));

alter table interviews
  add column if not exists article_status text not null default 'idle'
    check (article_status in ('idle', 'generating', 'ready', 'failed')),
  add column if not exists article_requested_at timestamptz,
  add column if not exists article_completed_at timestamptz,
  add column if not exists article_error text;

update interviews
set
  article_status = 'ready',
  article_completed_at = coalesce(article_completed_at, now()),
  article_error = null
where exists (
  select 1
  from articles
  where articles.interview_id = interviews.id
);
