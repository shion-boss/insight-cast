-- Generated 2026-05-07: Blog category redesign migration
-- Old: insight-cast/howto/service/interview/case/philosophy/news
-- New: ai-search/primary-info/casts/hp-update/meta (5系統トピック)
-- See: docs/decisions/2026-05-07-phase2-gates-and-marketing-strategy.md
--      ops/blog-taxonomy-2026-05-07.md

UPDATE blog_posts SET category = 'meta' WHERE slug = 'performance-50-to-90-improvement';
UPDATE blog_posts SET category = 'ai-search' WHERE slug = 'low-quality-content-misconception-seo';
UPDATE blog_posts SET category = 'casts' WHERE slug = 'ai-user-memory-feature-engagement';
UPDATE blog_posts SET category = 'meta' WHERE slug = 'insight-cast-quality-improvement-journey';
UPDATE blog_posts SET category = 'casts' WHERE slug = 'ai-cast-improvement-natural-interviews';
UPDATE blog_posts SET category = 'casts' WHERE slug = 'ai-interviewer-compassion-interviewing-skills';
UPDATE blog_posts SET category = 'meta' WHERE slug = 'quality-improvement-progress-transparency-policy';
UPDATE blog_posts SET category = 'ai-search' WHERE slug = 'article-not-read-entry-problem';
UPDATE blog_posts SET category = 'meta' WHERE slug = 'dogfooding-shapes-product-specs';
UPDATE blog_posts SET category = 'meta' WHERE slug = 'ai-quality-direction-over-rules';
UPDATE blog_posts SET category = 'casts' WHERE slug = 'ai-teaching-listening-skills-development';
UPDATE blog_posts SET category = 'primary-info' WHERE slug = 'ai-wrong-answers-extract-true-intentions';
UPDATE blog_posts SET category = 'hp-update' WHERE slug = 'ceo-workflow-insight-cast-three-steps';
UPDATE blog_posts SET category = 'primary-info' WHERE slug = 'local-everyday-becomes-travelers-wonder';
UPDATE blog_posts SET category = 'meta' WHERE slug = 'dogfooding-6-interviews-discovery';
UPDATE blog_posts SET category = 'ai-search' WHERE slug = 'seo-effective-blog-posts-primary-information';
UPDATE blog_posts SET category = 'hp-update' WHERE slug = 'daily-updates-with-ai-casts';
UPDATE blog_posts SET category = 'primary-info' WHERE slug = 'hidden-strengths-emerge-from-questions';
UPDATE blog_posts SET category = 'ai-search' WHERE slug = 'why-ai-articles-fail-in-search';
UPDATE blog_posts SET category = 'hp-update' WHERE slug = 'interview-format-removes-writers-block';
UPDATE blog_posts SET category = 'meta' WHERE slug = 'dashboard-should-be-simple';
UPDATE blog_posts SET category = 'meta' WHERE slug = 'developer-experience-ai-interview';
UPDATE blog_posts SET category = 'hp-update' WHERE slug = 'homepage-as-active-signboard';
UPDATE blog_posts SET category = 'hp-update' WHERE slug = 'why-blog-updates-stop';
UPDATE blog_posts SET category = 'meta' WHERE slug = 'origin-story-of-insight-cast';
UPDATE blog_posts SET category = 'meta' WHERE slug = 'insight-cast';
UPDATE blog_posts SET category = 'hp-update' WHERE slug = 'why-interview-before-ai-writing';
UPDATE blog_posts SET category = 'casts' WHERE slug = 'how-cast-works';
UPDATE blog_posts SET category = 'hp-update' WHERE slug = 'case-painting-company';
UPDATE blog_posts SET category = 'primary-info' WHERE slug = 'why-ordinary-is-value';
UPDATE blog_posts SET category = 'casts' WHERE slug = 'cast-guide';
UPDATE blog_posts SET category = 'hp-update' WHERE slug = 'report-guide';
