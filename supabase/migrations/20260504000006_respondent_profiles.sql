-- 回答者プロファイル
--
-- 取材を受けたユーザー（事業者）の話し方の傾向を、取材を重ねるごとに学習・蓄積する。
-- 次の取材で「この人は具体派 / 抽象派」「ペース速い / ゆっくり」を踏まえてプロンプトに薄く注入する。
--
-- 推定は AI 自己レビューと同じ取材完了時のフローで行う（lib/respondent-profile.ts を参照）。
-- 推定がつかない場合は NULL のままで構わない。

CREATE TABLE IF NOT EXISTS public.respondent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,  -- 任意。プロジェクト固有な特徴がある場合に使う
  answer_style text CHECK (answer_style IN ('concrete', 'abstract', 'mixed')),
  pace text CHECK (pace IN ('fast', 'slow', 'normal')),
  generation text CHECK (generation IN ('30s', '40s', '50s', '60s+', 'unknown')),
  regional_speech text,                          -- 'standard' / 'kansai' / 'tohoku' などの自由記述
  tendency text,                                 -- 自由記述（「具体例より価値観で答えがち」等、最大400字）
  last_interview_id uuid REFERENCES public.interviews(id) ON DELETE SET NULL,
  updated_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS respondent_profiles_user_idx
  ON public.respondent_profiles (user_id);

ALTER TABLE public.respondent_profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザー本人と、project_members（editor/viewer）が読める。書き込みは service_role のみ。
CREATE POLICY respondent_profiles_select ON public.respondent_profiles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = respondent_profiles.project_id
          AND pm.user_id = auth.uid()
          AND pm.role IN ('editor', 'viewer')
      )
    )
  );

CREATE TRIGGER respondent_profiles_updated_at
  BEFORE UPDATE ON public.respondent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.respondent_profiles IS
  '事業者ごとの話し方の傾向プロファイル。取材完了時に AI が推定して蓄積する。';
COMMENT ON COLUMN public.respondent_profiles.answer_style IS
  '回答の傾向: concrete=具体例で答える / abstract=抽象語で答えがち / mixed=両方';
COMMENT ON COLUMN public.respondent_profiles.pace IS
  '回答のペース: fast=テンポ速い / slow=ゆっくり / normal=普通';
COMMENT ON COLUMN public.respondent_profiles.tendency IS
  '自由記述。「数字より感情で語る」「失敗談を避ける」「お客様の話に強い」等の癖';
