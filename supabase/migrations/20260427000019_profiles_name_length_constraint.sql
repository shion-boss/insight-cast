-- profiles.name に長さ制約を追加する（100文字以内）
-- クライアント側 maxLength と一致させ、直接 SQL からの過長入力を防ぐ

ALTER TABLE profiles
  ADD CONSTRAINT profiles_name_length_check
  CHECK (name IS NULL OR length(name) <= 100);
