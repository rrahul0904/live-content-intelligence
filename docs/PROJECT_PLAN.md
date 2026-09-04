# Project Plan

## Mission

Build a creator-content intelligence platform that watches live content, detects moments worth clipping, explains why they matter, learns from editorial decisions, and evolves toward editing and multi-platform publishing.

## North-star workflow

```
Connect platform
 -> add creators/channels
 -> monitor live sessions
 -> compute rolling baselines
 -> detect candidate moments
 -> create/store platform-native clip reference
 -> review approve/reject
 -> learn channel preferences
 -> edit/publish
 -> learn from downstream performance
```

## Personas

### Creator
Wants good moments captured without watching the VOD again.

### Clipper/editor
Needs a ranked review queue with context and reasons.

### Agency
Needs many creators, team workflow, cost controls, SLAs, and aggregate analytics.

### Platform administrator
Needs worker health, API quotas, errors, cost/channel-hour, detector quality, and subscription health.

## Product principles

1. Live-first, not upload-first.
2. Explainable detection before expensive AI.
3. Normalize against each channel's own behavior.
4. Human review is training data, not friction.
5. Avoid storing source video when platform-native clipping is available.
6. Run expensive semantic models only on high-value candidate windows.
7. Keep the control plane separate from long-running data-plane workers.
8. Design every monitoring primitive for idempotency and recovery.

## Success metrics

- approved clips / reviewed clips
- candidate precision at top K
- median detection-to-clip latency
- monitored channel-hours
- worker uptime and recovery rate
- cost per monitored channel-hour
- free-to-paid conversion
- retained monitored channels at D30
- downstream views per approved clip

## Initial scope

Twitch, seven deterministic signals, configurable presets, live telemetry, automatic candidate clipping abstraction, review queue, feedback storage, and operational metrics.

## Explicit non-goals for Phase 0

- claiming production Twitch clipping before credentials are configured
- large-model inference on every second of a stream
- downloading/storing entire live broadcasts
- copying another product's private implementation
