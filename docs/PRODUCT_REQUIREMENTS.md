# Product Requirements

## P0 user stories

### Authentication
- User can connect a Twitch identity through OAuth.
- Tokens are encrypted at rest and refreshable.
- User can disconnect and revoke platform access.

### Channel management
- User can search/add a Twitch channel.
- User selects a cold-start preset.
- User can enable/disable monitoring.
- Limits are enforced by plan and concurrent active sessions.

### Live streams
- User sees whether configured channels are online.
- Live channel view shows current score, threshold, recent score history, active preset, learned weights, and monitoring health.
- Monitoring sessions survive transient worker failures.

### Detection
- Service ingests seven normalized signal values.
- Score calculation is deterministic and versioned.
- Cooldown and deduplication prevent clip storms.
- Every trigger persists its feature vector and detector version.

### Review
- Candidate clips enter a review queue.
- User can approve or reject.
- Decision, reviewer, reason, and timestamp are stored.
- Feedback updates a future calibration job rather than mutating history.

### Library
- Approved clips can be filtered by creator, game/category, capture date, score, and review state.

### Operations/admin
- active monitor count
- queued/leased/failed jobs
- Twitch API errors
- trigger rate
- review approval rate
- detector version distribution
- compute/channel-hour estimate

## Later requirements

VOD scanning, caption generation, vertical reframe, brand templates, scheduler, publishing connectors, team roles, client approval, virality model, and multi-platform ingestion.
