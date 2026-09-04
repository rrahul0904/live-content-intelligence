# Security

## Threat model

Highest-value assets are OAuth refresh tokens, account sessions, billing identity, creator/team permissions, and operational admin access.

## Required controls

- encrypt platform tokens at application level
- secrets only via runtime secret manager
- HttpOnly/Secure/SameSite cookies
- CSRF protection where applicable
- strict redirect URI allowlist
- RBAC for organizations
- separate admin surface and policy
- MFA/SSO for privileged operators
- rate limits on auth and mutation endpoints
- audit log for permission, billing, token, and admin actions
- dependency and container scanning in CI
- no raw secrets in logs/traces
- signed webhook verification
- deletion/revocation workflow

## Privacy by architecture

Default to retaining metadata and derived signals rather than source broadcasts. Keep limited chat context only when required to explain a candidate and apply retention controls.

## Public repository rule

The repository intentionally contains no Twitch, Stripe, database, or encryption credentials.
