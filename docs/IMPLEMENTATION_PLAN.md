# Implementation Plan

## Phase 0 — foundation (this commit)

- monorepo and CI
- dashboard concept
- control API health/config endpoints
- PostgreSQL domain model
- seven-signal model and scorer
- stream-monitor state machine skeleton
- Docker local dependencies
- product, architecture, security, cost, and integration docs

## Phase 1 — Twitch control plane

- Twitch application registration
- OAuth authorization-code flow
- encrypted token vault
- identity/session handling
- channel lookup and add/remove APIs
- stream online/offline discovery
- plan limit enforcement
- webhook/EventSub evaluation

Acceptance: a signed-in user can add a channel and the system reliably knows when it becomes live.

## Phase 2 — durable live monitoring

- Redis/BullMQ or Temporal workflow
- worker leases + heartbeats
- chat ingestion adapter
- viewer/metadata sampler
- lightweight audio features
- rolling baseline persistence
- SSE telemetry to dashboard

Acceptance: restart any worker during a live stream without losing the logical monitor session.

## Phase 3 — trigger and clipping

- preset registry
- signal normalization
- threshold/cooldown/dedupe
- Twitch Clips API adapter
- persisted candidate feature vectors
- review queue

Acceptance: test channels generate reproducible candidate events and platform clip records without duplicates.

## Phase 4 — feedback learning

- approve/reject UX
- calibration jobs
- threshold update bounds
- per-signal weight updates
- offline evaluation against historical decisions
- quality dashboard

Acceptance: a calibration version can be evaluated and rolled back before activation.

## Phase 5 — VOD and semantic intelligence

- VOD job lifecycle
- candidate audio windows
- speech-to-text only for candidates
- event classification and summaries
- explainable “why this moment” UI
- virality ranking experiment

## Phase 6 — creator content factory

- crop/reframe
- captions
- templates/branding
- editor
- publishing scheduler
- downstream content performance feedback

## Phase 7 — agency scale

- organizations/workspaces
- roles and client approvals
- creator portfolios
- quotas and budgets
- multi-platform adapters
- enterprise audit and SSO
