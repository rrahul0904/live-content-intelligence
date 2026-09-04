# Live Content Intelligence

Real-time creator content intelligence for detecting, explaining, reviewing, and eventually publishing the best moments from live streams.

> This is an independent product inspired by the workflow category demonstrated by Highlightz. It is not affiliated with Highlightz or Twitch, and it does not copy proprietary source code.

## Product thesis

Most clipping tools start after a video is finished. Live Content Intelligence starts while the stream is happening:

```
live stream -> signals -> normalized score -> candidate moment -> platform clip
            -> human review -> learning -> better future detection
```

The first milestone targets Twitch because its OAuth, stream metadata, chat ecosystem, and Clips workflow allow us to validate the core loop without storing full source video.

## Foundation included

- Next.js operator/creator dashboard shell
- TypeScript control API
- Python seven-signal scoring engine
- Long-running stream-monitor worker skeleton
- PostgreSQL schema for users, channels, sessions, signals, clips, feedback, and subscriptions
- Redis-ready queue/runtime boundary
- Docker Compose local dependencies
- architecture, security, cost, roadmap, Twitch, and implementation docs
- unit tests for the scoring engine
- CI workflow

## Monorepo

```
apps/
  web/                    Next.js dashboard
services/
  control-api/            account/channel/clip control plane
  stream-monitor/         long-running monitoring sessions
  signal-engine/          normalization + scoring
packages/
  contracts/              shared API/domain types
  database/               PostgreSQL migrations
docs/                     product and engineering specifications
infrastructure/docker/    container images
```

## Core detector

The initial detector evaluates seven explainable signals:

1. chat velocity
2. keyword intensity
3. emote burst
4. sentiment intensity
5. audio spike
6. viewer spike
7. silence burst

Every channel is compared with its own rolling baseline. A preset supplies cold-start weights, then human approval/rejection can later tune per-channel thresholds and weights.

## Run locally

Requirements: Node 22+, pnpm 9+, Python 3.12+, Docker.

```bash
cp .env.example .env
docker compose up -d postgres redis
pnpm install
pnpm dev
```

For the Python signal engine:

```bash
cd services/signal-engine
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

## Current status

Phase 0 foundation. Twitch OAuth/API calls are represented by explicit interfaces and placeholders until application credentials are configured. No credentials belong in git.

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for the build sequence.
