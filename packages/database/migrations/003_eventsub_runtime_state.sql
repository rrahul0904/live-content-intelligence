create table if not exists provider_events (
  message_id text primary key,
  provider text not null,
  event_type text not null,
  event_timestamp timestamptz not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create table if not exists channel_runtime_state (
  provider text not null,
  provider_channel_id text not null,
  is_live boolean not null default false,
  provider_stream_id text,
  started_at timestamptz,
  last_event_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key(provider, provider_channel_id)
);

create index if not exists provider_events_type_time_idx
  on provider_events(provider, event_type, event_timestamp desc);
