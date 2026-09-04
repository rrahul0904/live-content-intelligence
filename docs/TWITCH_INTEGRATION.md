# Twitch Integration

Verified against Twitch developer documentation on 2026-09-04.

## Authentication model

The application uses three distinct authorization concerns.

### User sign-in and clip permission

The API uses Twitch's server-side authorization-code flow. The requested scopes are:

```
clips:edit
user:read:email
```

`clips:edit` is required by Twitch's live Create Clip endpoint. `user:read:email` is requested only because the application stores the connected user's email when Twitch returns it.

Access and refresh tokens are encrypted with AES-256-GCM before persistence. The browser receives only a signed HttpOnly application session cookie.

### Public Helix discovery

Channel lookup and Get Streams use an app access token obtained through the client-credentials flow. This avoids using or refreshing user tokens for public data.

### EventSub

When a public webhook callback URL and webhook secret are configured, monitored channels are subscribed to:

```
stream.online
stream.offline
```

Twitch documents these two event types as requiring no broadcaster authorization. Webhook subscription creation uses an app access token.

## OAuth routes

```
GET /auth/twitch/start
GET /auth/twitch/callback
POST /auth/logout
GET /v1/me
```

OAuth uses a random state value held in a signed, HttpOnly, short-lived cookie and compared with constant-time equality on callback.

## Helix operations

Implemented:
- Get Users for connected identity
- Get Users by login for channel discovery
- Get Streams for current live status
- Create Clip client method for the next trigger/clipping phase
- Create EventSub Subscription for online/offline transitions

## EventSub webhook security

`POST /webhooks/twitch/eventsub`:

1. captures the exact raw request body;
2. requires Twitch message ID, timestamp, type, and signature headers;
3. rejects messages outside a 10-minute replay window;
4. computes HMAC-SHA256 using the configured EventSub secret;
5. compares signatures with constant-time equality;
6. returns the Twitch challenge for callback verification;
7. records notification message IDs idempotently;
8. updates durable channel runtime state.

## API safety

- app token cached until near expiry
- user token refreshed before expiry
- structured Twitch error codes
- EventSub duplicate protection
- EventSub subscription conflicts treated as already configured
- plan limits enforced before enabling another channel
- live-status polling remains available if EventSub cannot be configured

## Future work

Phase 2 will consume online/offline state to create durable monitor jobs. Phase 3 will invoke Create Clip only from idempotent trigger records and reconcile Twitch's asynchronous clip creation result.
