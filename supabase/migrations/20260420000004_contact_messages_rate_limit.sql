alter table contact_messages
  add column ip_hash text,
  add column user_agent text;

create index contact_messages_created_at_idx
  on contact_messages (created_at desc);

create index contact_messages_ip_hash_created_at_idx
  on contact_messages (ip_hash, created_at desc);

create index contact_messages_email_created_at_idx
  on contact_messages (lower(email), created_at desc);
