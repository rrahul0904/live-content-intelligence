# Phase 1 — Twitch Control Plane

Status: implemented in source; external Twitch application credentials are required to exercise the integration against Twitch.

## Delivered

### Authentication
- server-side Twitch authorization-code flow
- CSRF-resistant OAuth state cookie
- signed HttpOnly application session
- automatic refresh-token exchange
- AES-256-GCM encryption of Twitch access/refresh tokens before PostgreSQL storage
- user profile upsert from Helix

### Channel registry
- Twitch login discovery through Helix
- add/remove monitored channels
- pause/re-enable monitoring configuration
- cold-start preset selection
- Free/Starter/Pro/Agency/Enterprise channel limits
- live/offline status and current stream metadata

### EventSub
- optional webhook subscriptions for stream.online and stream.offline
- app-access-token subscription creation
- HMAC-SHA256 webhook verification against raw bytes
- stale-message rejection
- message-id idempotency
- durable provider event log
- durable channel live/offline runtime state
- polling through Get Streams remains the fallback when EventSub is not configured

## Environment

Create a Twitch application and configure the redirect URI exactly:

```
http://localhost:3001/auth/twitch/callback
```

For a deployed environment use the HTTPS API hostname instead.

Required:

```env
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
TWITCH_REDIRECT_URI=https://api.example.com/auth/twitch/callback
TOKEN_ENCRYPTION_KEY=<high entropy 32+ chars>
COOKIE_SECRET=<independent high entropy 32+ chars>
```

To enable EventSub:

```env
TWITCH_EVENTSUB_CALLBACK_URL=https://api.example.com/webhooks/twitch/eventsub
TWITCH_EVENTSUB_SECRET=<high entropy secret>
```

The EventSub callback must be publicly reachable via HTTPS for Twitch to complete challenge verification.

## Database

Apply migrations in order:

```bash
psql "$DATABASE_URL" -f packages/database/migrations/001_init.sql
psql "$DATABASE_URL" -f packages/database/migrations/002_twitch_control_plane.sql
psql "$DATABASE_URL" -f packages/database/migrations/003_eventsub_runtime_state.sql
```

## User flow

```
/channels
  -> Continue with Twitch
  -> /auth/twitch/start
  -> Twitch consent
  -> /auth/twitch/callback
  -> encrypted tokens + session
  -> /channels
  -> search Twitch login
  -> choose preset
  -> add channel
  -> optional EventSub registration
  -> live/offline status
```

## Phase 1 API

```
GET    /health
GET    /ready
GET    /auth/twitch/start
GET    /auth/twitch/callback
POST   /auth/logout
GET    /v1/me
GET    /v1/runtime/config
GET    /v1/detector/presets
GET    /v1/channels/search?login=...
GET    /v1/channels
POST   /v1/channels
PATCH  /v1/channels/:id
DELETE /v1/channels/:id
POST   /webhooks/twitch/eventsub
```

## Security boundaries

The browser never receives the Twitch client secret, refresh token, or plaintext stored credential. Public channel/status lookups use an app token. The user token is retained for operations that need user authorization, including live clip creation in the next clipping phase.

## Remaining external setup

The code cannot self-issue Twitch production credentials. Registering the Twitch application and supplying deployment secrets are environment/operator actions.
