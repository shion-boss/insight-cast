alter table projects
  drop constraint if exists projects_status_check;

alter table projects
  add constraint projects_status_check
  check (status in ('analysis_pending', 'analyzing', 'report_ready', 'interview_ready', 'interview_done', 'article_ready'));
