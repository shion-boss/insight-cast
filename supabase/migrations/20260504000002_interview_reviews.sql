-- 取材レビュー（interview_reviews）
--
-- 取材1本ごとに「キャラらしさ」「問いの質」「楽しさ」を点数化＋良かった点・改善点の記述を蓄積する。
-- character-persona-feedback-loop スキルが、cast_talk_reviews とともにこのテーブルから症例を集めて
-- AIキャストの本質ルール / 取材固有ルールへ反映する。

create table public.interview_reviews (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  -- 1=とても悪い / 3=普通 / 5=とても良い
  overall_score smallint not null check (overall_score between 1 and 5),
  character_score smallint check (character_score between 1 and 5),         -- キャラらしさ
  question_quality_score smallint check (question_quality_score between 1 and 5),  -- 問いの質
  enjoyment_score smallint check (enjoyment_score between 1 and 5),          -- 楽しさ・また話したいか
  good_points text,
  improve_points text,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  reviewer_role text not null check (reviewer_role in ('owner', 'staff', 'respondent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 1取材1レビュー（更新は upsert で行う）
  unique (interview_id)
);

create index interview_reviews_interview_id_idx on public.interview_reviews (interview_id);
create index interview_reviews_created_at_idx on public.interview_reviews (created_at desc);

alter table public.interview_reviews enable row level security;

-- ポリシー: プロジェクトオーナーまたは editor メンバーが、自分の所有・所属プロジェクトの
-- インタビューに対してのみ select / insert / update できる。service_role は RLS をバイパス。

create policy interview_reviews_select on public.interview_reviews
  for select
  using (
    exists (
      select 1 from public.interviews i
      join public.projects p on p.id = i.project_id
      where i.id = interview_reviews.interview_id
        and (
          p.user_id = auth.uid()
          or exists (
            select 1 from public.project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role in ('editor', 'viewer')
          )
        )
    )
  );

create policy interview_reviews_insert on public.interview_reviews
  for insert
  with check (
    exists (
      select 1 from public.interviews i
      join public.projects p on p.id = i.project_id
      where i.id = interview_reviews.interview_id
        and (
          p.user_id = auth.uid()
          or exists (
            select 1 from public.project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role = 'editor'
          )
        )
    )
  );

create policy interview_reviews_update on public.interview_reviews
  for update
  using (
    exists (
      select 1 from public.interviews i
      join public.projects p on p.id = i.project_id
      where i.id = interview_reviews.interview_id
        and (
          p.user_id = auth.uid()
          or exists (
            select 1 from public.project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role = 'editor'
          )
        )
    )
  );

create trigger interview_reviews_updated_at
  before update on public.interview_reviews
  for each row execute function public.set_updated_at();

comment on table public.interview_reviews is '取材1本ごとの品質レビュー。character-persona-feedback-loop の症例ソース。';
comment on column public.interview_reviews.character_score is 'キャラらしさ（人格・観点・口調が崩れていないか）';
comment on column public.interview_reviews.question_quality_score is '問いの質（答えやすく、専門性に沿った質問が出ていたか）';
comment on column public.interview_reviews.enjoyment_score is '楽しさ・また話したいと思える会話だったか';
comment on column public.interview_reviews.reviewer_role is '誰がレビューしたか: owner=プロジェクトオーナー, staff=社内スタッフ, respondent=回答者';
