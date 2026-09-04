# Technical Architecture

## Separation of concerns

The web/control plane must never own long-running live monitoring. Serverless web runtimes are optimized for request/response work; monitoring sessions may last many hours.

```
                       +----------------------+
                       | Next.js web dashboard|
                       +----------+-----------+
                                  |
                               HTTPS/SSE
                                  |
                       +----------v-----------+
                       |    Control API       |
                       +----+----------+------+
                            |          |
                        Postgres     Redis
                            |          |
                            |       job/state
                            |          |
                  +---------v----------v---------+
                  |  Monitoring orchestration   |
                  +------------+----------------+
                               |
                +--------------+--------------+
                |                             |
        +-------v--------+             +------v------+
        | stream workers |             | VOD workers |
        +--+----------+--+             +-------------+
           |          |
        Twitch      audio/chat
           |          |
           +-----+----+
                 |
          +------v-------+
          | signal engine |
          +------+--------+
                 |
          +------v--------+
          | trigger engine |
          +------+---------+
                 |
          platform clip API
                 |
          +------v---------+
          | review + learn |
          +----------------+
```

## Runtime choices

- Web: Next.js + React + TypeScript.
- API: Fastify/TypeScript.
- Signal and media workers: Python.
- Durable source of truth: PostgreSQL.
- Volatile coordination, leases, counters: Redis.
- Media processing: FFmpeg.
- Metrics/traces/logs: OpenTelemetry-compatible pipeline.
- Frontend deployment can use Vercel.
- Workers should use containers (ECS/Fargate, Fly, Kubernetes, or similar).

## Event contracts

Important events should be versioned:
- stream.detected_online.v1
- monitor.started.v1
- signal.sampled.v1
- highlight.triggered.v1
- clip.created.v1
- clip.reviewed.v1
- calibration.requested.v1

At-least-once delivery is acceptable if handlers are idempotent.

## Reliability invariants

- one active monitoring lease per user-channel-stream tuple
- trigger idempotency key includes stream + rounded candidate timestamp + detector version
- Twitch create-clip calls are retried only when safe
- worker heartbeat expiration makes work recoverable
- historical score/feature rows are immutable
