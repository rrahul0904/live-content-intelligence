# Live Content Intelligence

Real-time creator content intelligence for detecting, explaining, reviewing, and eventually publishing the best moments from live streams.

> Independent implementation inspired by the live-highlight product category. It is not affiliated with Highlightz or Twitch and does not copy proprietary source code.

## Product thesis

```
live stream -> signals -> normalized score -> candidate moment -> platform clip
            -> human review -> learning -> better future detection
```

## Current implementation

### Phase 0 — complete
- Next.js creator/operator dashboard
- TypeScript control API
- Python seven-signal scoring engine
- PostgreSQL domain schema
- stream-monitor worker foundation
- Docker/CI/docs

### Phase 1 — implemented
- Twitch authorization-code OAuth
- signed application sessions
- encrypted Twitch access/refresh tokens
- automatic token refresh
- app-token Helix client
- Twitch channel discovery
- current stream lookup
- channel add/pause/enable/remove
- plan channel limits
- EventSub online/offline registration
- verified EventSub webhook receiver
- idempotent provider event log
- durable channel runtime state
- real Channels management UI

Twitch credentials are intentionally not committed. Registering an application in the Twitch developer console and supplying deployment secrets are required to exercise live integration.

## Monorepo

```
apps/
  web/                    Next.js dashboard + channel registry
services/
  control-api/            OAuth, Twitch/Helix, channels, EventSub
  stream-monitor/         long-running monitoring sessions
  signal-engine/          normalization + scoring
packages/
  contracts/              shared API/domain types
  database/               PostgreSQL migrations
docs/                     product and engineering specifications
infrastructure/docker/    container images
```

## Core detector

The initial explainable detector evaluates:

1. chat velocity
2. keyword intensity
3. emote burst
4. sentiment intensity
5. audio spike
6. viewer spike
7. silence burst

Every channel will be normalized against its own rolling behavior. Presets provide cold-start thresholds and weights; reviewed clips become calibration data later.

## Local foundation

Requirements: Node 22+, pnpm 9+, Python 3.12+, Docker.

```bash
cp .env.example .env
docker compose up -d postgres redis
psql "$DATABASE_URL" -f packages/database/migrations/001_init.sql
psql "$DATABASE_URL" -f packages/database/migrations/002_twitch_control_plane.sql
psql "$DATABASE_URL" -f packages/database/migrations/003_eventsub_runtime_state.sql
pnpm install
pnpm dev
```

Without Twitch credentials the dashboard foundation can run, but OAuth and Helix requests correctly report that integration is not configured.

Signal engine:

```bash
cd services/signal-engine
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

## Next phase

Phase 2 turns stream state into a durable monitoring data plane: Redis-backed jobs, worker leasing/recovery, live telemetry, chat/viewer/audio signal collection, rolling baselines, and SSE updates.

See:
- [Phase 1 runbook](docs/PHASE_1_IMPLEMENTATION.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Twitch integration](docs/TWITCH_INTEGRATION.md)
- [Technical architecture](docs/TECHNICAL_ARCHITECTURE.md)
