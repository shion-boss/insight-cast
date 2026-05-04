-- interviews.interviewer_type の CHECK 制約を全 6 キャラに拡張
--
-- 元の制約は ('mint','claus','rain') のみで、ハル・モグロ・コッコの
-- INSERT が失敗していた（取材作成 action が 303 で戻されてしまう原因）。

ALTER TABLE public.interviews
  DROP CONSTRAINT IF EXISTS interviews_interviewer_type_check;

ALTER TABLE public.interviews
  ADD CONSTRAINT interviews_interviewer_type_check
  CHECK (interviewer_type IN ('mint', 'claus', 'rain', 'hal', 'mogro', 'cocco'));

COMMENT ON COLUMN public.interviews.interviewer_type IS
  'AIキャストの id。lib/characters.ts の CHARACTERS と同期する。新キャラ追加時はこの CHECK 制約も更新する。';
