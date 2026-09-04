create extension if not exists pgcrypto;

create type review_state as enum ('pending','approved','rejected');
create type monitor_state as enum ('starting','running','draining','stopped','failed');

create table users (
  id uuid primary key default gen_random_uuid(),
  twitch_user_id text unique,
  display_name text not null,
  email text,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table oauth_credentials (
  user_id uuid primary key references users(id) on delete cascade,
  provider text not null default 'twitch',
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  expires_at timestamptz,
  scopes text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table channels (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'twitch',
  provider_channel_id text not null,
  login text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique(provider, provider_channel_id)
);

create table user_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  channel_id uuid not null references channels(id) on delete cascade,
  preset text not null default 'default',
  threshold numeric(5,2) not null default 72,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, channel_id)
);

create table detector_versions (
  id uuid primary key default gen_random_uuid(),
  user_channel_id uuid not null references user_channels(id) on delete cascade,
  version integer not null,
  weights jsonb not null,
  threshold numeric(5,2) not null,
  status text not null check (status in ('candidate','active','retired')),
  created_at timestamptz not null default now(),
  unique(user_channel_id, version)
);

create table monitor_sessions (
  id uuid primary key default gen_random_uuid(),
  user_channel_id uuid not null references user_channels(id) on delete cascade,
  provider_stream_id text not null,
  state monitor_state not null default 'starting',
  lease_owner text,
  heartbeat_at timestamptz,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  unique(user_channel_id, provider_stream_id)
);

create table signal_samples (
  id bigserial primary key,
  monitor_session_id uuid not null references monitor_sessions(id) on delete cascade,
  sampled_at timestamptz not null,
  score numeric(5,2) not null,
  threshold numeric(5,2) not null,
  signals jsonb not null,
  detector_version integer not null
);
create index signal_samples_session_time_idx on signal_samples(monitor_session_id, sampled_at desc);

create table clips (
  id uuid primary key default gen_random_uuid(),
  user_channel_id uuid not null references user_channels(id) on delete cascade,
  monitor_session_id uuid references monitor_sessions(id) on delete set null,
  provider_clip_id text,
  provider_url text,
  captured_at timestamptz not null,
  trigger_score numeric(5,2) not null,
  threshold numeric(5,2) not null,
  detector_version integer not null,
  review_state review_state not null default 'pending',
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);
create index clips_review_queue_idx on clips(user_channel_id, review_state, captured_at desc);

create table clip_signals (
  clip_id uuid primary key references clips(id) on delete cascade,
  signals jsonb not null,
  contributions jsonb not null,
  explanation jsonb
);

create table clip_feedback (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references clips(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  decision review_state not null check (decision <> 'pending'),
  reason text,
  created_at timestamptz not null default now()
);
create index clip_feedback_clip_idx on clip_feedback(clip_id, created_at);

create table subscriptions (
  user_id uuid primary key references users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null,
  status text not null,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table broadcaster_opt_outs (
  provider text not null,
  provider_channel_id text not null,
  reason text,
  created_at timestamptz not null default now(),
  primary key(provider, provider_channel_id)
);
