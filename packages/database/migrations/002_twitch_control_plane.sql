alter table users
  add column if not exists login text,
  add column if not exists profile_image_url text;

alter table channels
  add column if not exists profile_image_url text,
  add column if not exists description text,
  add column if not exists broadcaster_type text;

alter table user_channels
  add column if not exists updated_at timestamptz not null default now();

create index if not exists user_channels_enabled_idx
  on user_channels(user_id, enabled);

create index if not exists channels_login_idx
  on channels(provider, lower(login));

comment on column oauth_credentials.access_token_ciphertext is
  'Application-encrypted OAuth access token. Never store plaintext tokens here.';

comment on column oauth_credentials.refresh_token_ciphertext is
  'Application-encrypted OAuth refresh token. Never store plaintext tokens here.';
