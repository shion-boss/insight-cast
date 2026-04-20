alter table contact_messages
  alter column created_at set not null;

alter table contact_messages
  enable row level security;

create policy "public can submit contact messages" on contact_messages
  for insert to anon, authenticated
  with check (
    length(trim(name)) > 0
    and length(trim(email)) > 0
    and position('@' in email) > 1
    and length(trim(message)) > 0
  );
