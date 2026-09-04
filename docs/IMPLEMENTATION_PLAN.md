# Implementation Plan

## Phase 0 — foundation — COMPLETE

- monorepo and CI
- dashboard concept
- control API health/config endpoints
- PostgreSQL domain model
- seven-signal model and scorer
- stream-monitor state machine skeleton
- Docker local dependencies
- product, architecture, security, cost, and integration docs

## Phase 1 — Twitch control plane — IMPLEMENTED

- Twitch authorization-code OAuth flow
- encrypted token vault and refresh flow
- identity/session handling
- channel lookup and add/remove/pause APIs
- live/offline discovery through Get Streams
- plan limit enforcement
- EventSub stream.online/stream.offline subscription support
- verified EventSub webhook ingestion and durable runtime state
- real Channels management UI

External prerequisite: register a Twitch application and configure secrets/redirect URLs in the deployment environment.

Acceptance: after credentials and migrations are configured, a signed-in user can add a channel and the control plane can resolve its current live state; deployed environments can also receive Twitch online/offline events.

## Phase 2 — durable live monitoring — NEXT

- Redis-backed work queue
- monitor leases + heartbeats + recovery
- online/offline reconciler
- viewer/metadata sampler
- chat ingestion adapter
- rolling baseline persistence
- signal-sample ingestion
- SSE telemetry to dashboard
- worker operational endpoints

Acceptance: restart any worker during a live stream without losing the logical monitor session, and display a live score feed without the web process owning the monitor.

## Phase 3 — trigger and clipping

- preset registry expansion
- production signal normalization
- threshold/cooldown/dedupe
- Twitch Clips API orchestration
- asynchronous clip reconciliation
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
