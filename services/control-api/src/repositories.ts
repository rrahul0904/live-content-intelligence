import { query } from "./db.js";

export interface UserRow {
  id: string;
  twitch_user_id: string;
  login: string | null;
  display_name: string;
  email: string | null;
  profile_image_url: string | null;
  plan: string;
}

export interface CredentialRow {
  user_id: string;
  access_token_ciphertext: string;
  refresh_token_ciphertext: string | null;
  expires_at: Date | null;
  scopes: string[];
}

export interface UserChannelRow {
  id: string;
  user_id: string;
  channel_id: string;
  preset: string;
  threshold: string;
  enabled: boolean;
  provider_channel_id: string;
  login: string;
  display_name: string;
  profile_image_url: string | null;
  description: string | null;
  broadcaster_type: string | null;
}

export async function upsertTwitchUser(profile: {
  id: string;
  login: string;
  displayName: string;
  email?: string;
  profileImageUrl?: string;
}): Promise<UserRow> {
  const [row] = await query<UserRow>(
    `insert into users (
       twitch_user_id, login, display_name, email, profile_image_url
     ) values ($1,$2,$3,$4,$5)
     on conflict (twitch_user_id) do update set
       login = excluded.login,
       display_name = excluded.display_name,
       email = excluded.email,
       profile_image_url = excluded.profile_image_url
     returning id, twitch_user_id, login, display_name, email, profile_image_url, plan`,
    [profile.id, profile.login, profile.displayName, profile.email ?? null, profile.profileImageUrl ?? null]
  );
  if (!row) throw new Error("Unable to upsert Twitch user");
  return row;
}

export async function getUser(userId: string): Promise<UserRow | null> {
  const [row] = await query<UserRow>(
    "select id, twitch_user_id, login, display_name, email, profile_image_url, plan from users where id = $1",
    [userId]
  );
  return row ?? null;
}

export async function saveCredential(input: {
  userId: string;
  accessTokenCiphertext: string;
  refreshTokenCiphertext?: string | null;
  expiresAt?: Date | null;
  scopes: string[];
}): Promise<void> {
  await query(
    `insert into oauth_credentials (
       user_id, provider, access_token_ciphertext, refresh_token_ciphertext, expires_at, scopes, updated_at
     ) values ($1,'twitch',$2,$3,$4,$5,now())
     on conflict (user_id) do update set
       access_token_ciphertext = excluded.access_token_ciphertext,
       refresh_token_ciphertext = excluded.refresh_token_ciphertext,
       expires_at = excluded.expires_at,
       scopes = excluded.scopes,
       updated_at = now()`,
    [
      input.userId,
      input.accessTokenCiphertext,
      input.refreshTokenCiphertext ?? null,
      input.expiresAt ?? null,
      input.scopes
    ]
  );
}

export async function getCredential(userId: string): Promise<CredentialRow | null> {
  const [row] = await query<CredentialRow>(
    `select user_id, access_token_ciphertext, refresh_token_ciphertext, expires_at, scopes
     from oauth_credentials where user_id = $1 and provider = 'twitch'`,
    [userId]
  );
  return row ?? null;
}

export async function countEnabledChannels(userId: string): Promise<number> {
  const [row] = await query<{ count: string }>(
    "select count(*)::text as count from user_channels where user_id = $1 and enabled = true",
    [userId]
  );
  return Number(row?.count ?? 0);
}

export async function getUserChannelByProviderId(
  userId: string,
  providerChannelId: string
): Promise<UserChannelRow | null> {
  const [row] = await query<UserChannelRow>(
    `select uc.id, uc.user_id, uc.channel_id, uc.preset, uc.threshold::text, uc.enabled,
            c.provider_channel_id, c.login, c.display_name, c.profile_image_url,
            c.description, c.broadcaster_type
     from user_channels uc
     join channels c on c.id = uc.channel_id
     where uc.user_id = $1 and c.provider = 'twitch' and c.provider_channel_id = $2`,
    [userId, providerChannelId]
  );
  return row ?? null;
}

export async function listUserChannels(userId: string): Promise<UserChannelRow[]> {
  return query<UserChannelRow>(
    `select uc.id, uc.user_id, uc.channel_id, uc.preset, uc.threshold::text, uc.enabled,
            c.provider_channel_id, c.login, c.display_name, c.profile_image_url,
            c.description, c.broadcaster_type
     from user_channels uc
     join channels c on c.id = uc.channel_id
     where uc.user_id = $1
     order by uc.created_at desc`,
    [userId]
  );
}

export async function addUserChannel(input: {
  userId: string;
  providerChannelId: string;
  login: string;
  displayName: string;
  profileImageUrl?: string;
  description?: string;
  broadcasterType?: string;
  preset: string;
  threshold: number;
}): Promise<UserChannelRow> {
  const [channel] = await query<{ id: string }>(
    `insert into channels (
       provider, provider_channel_id, login, display_name, profile_image_url, description, broadcaster_type
     ) values ('twitch',$1,$2,$3,$4,$5,$6)
     on conflict (provider, provider_channel_id) do update set
       login = excluded.login,
       display_name = excluded.display_name,
       profile_image_url = excluded.profile_image_url,
       description = excluded.description,
       broadcaster_type = excluded.broadcaster_type
     returning id`,
    [
      input.providerChannelId,
      input.login,
      input.displayName,
      input.profileImageUrl ?? null,
      input.description ?? null,
      input.broadcasterType ?? null
    ]
  );
  if (!channel) throw new Error("Unable to save channel");

  await query(
    `insert into user_channels (user_id, channel_id, preset, threshold, enabled)
     values ($1,$2,$3,$4,true)
     on conflict (user_id, channel_id) do update set
       preset = excluded.preset,
       threshold = excluded.threshold,
       enabled = true,
       updated_at = now()`,
    [input.userId, channel.id, input.preset, input.threshold]
  );

  const saved = await getUserChannelByProviderId(input.userId, input.providerChannelId);
  if (!saved) throw new Error("Unable to load saved channel");
  return saved;
}

export async function updateUserChannel(
  userId: string,
  userChannelId: string,
  patch: { enabled?: boolean; preset?: string; threshold?: number }
): Promise<UserChannelRow | null> {
  const [row] = await query<UserChannelRow>(
    `update user_channels uc set
       enabled = coalesce($3, uc.enabled),
       preset = coalesce($4, uc.preset),
       threshold = coalesce($5, uc.threshold),
       updated_at = now()
     from channels c
     where uc.id = $2 and uc.user_id = $1 and c.id = uc.channel_id
     returning uc.id, uc.user_id, uc.channel_id, uc.preset, uc.threshold::text, uc.enabled,
       c.provider_channel_id, c.login, c.display_name, c.profile_image_url,
       c.description, c.broadcaster_type`,
    [userId, userChannelId, patch.enabled ?? null, patch.preset ?? null, patch.threshold ?? null]
  );
  return row ?? null;
}

export async function removeUserChannel(userId: string, userChannelId: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    "delete from user_channels where id = $2 and user_id = $1 returning id",
    [userId, userChannelId]
  );
  return rows.length === 1;
}

export async function recordTwitchStreamEvent(input: {
  messageId: string;
  eventType: "stream.online" | "stream.offline";
  eventTimestamp: Date;
  providerChannelId: string;
  providerStreamId?: string | null;
  startedAt?: Date | null;
  payload: unknown;
}): Promise<boolean> {
  const inserted = await query<{ message_id: string }>(
    `insert into provider_events (
       message_id, provider, event_type, event_timestamp, payload
     ) values ($1,'twitch',$2,$3,$4::jsonb)
     on conflict (message_id) do nothing
     returning message_id`,
    [
      input.messageId,
      input.eventType,
      input.eventTimestamp,
      JSON.stringify(input.payload)
    ]
  );

  if (inserted.length === 0) return false;

  const isLive = input.eventType === "stream.online";
  await query(
    `insert into channel_runtime_state (
       provider, provider_channel_id, is_live, provider_stream_id, started_at, last_event_at, updated_at
     ) values ('twitch',$1,$2,$3,$4,$5,now())
     on conflict (provider, provider_channel_id) do update set
       is_live = excluded.is_live,
       provider_stream_id = excluded.provider_stream_id,
       started_at = excluded.started_at,
       last_event_at = excluded.last_event_at,
       updated_at = now()
     where excluded.last_event_at >= channel_runtime_state.last_event_at`,
    [
      input.providerChannelId,
      isLive,
      isLive ? input.providerStreamId ?? null : null,
      isLive ? input.startedAt ?? null : null,
      input.eventTimestamp
    ]
  );

  return true;
}
