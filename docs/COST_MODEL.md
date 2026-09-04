# Cost Model

The important unit is **cost per monitored channel-hour**, not request count.

## Cost buckets

- monitoring worker CPU/RAM
- Twitch/API traffic
- audio feature extraction
- Redis operations
- PostgreSQL ingest/storage
- telemetry/log volume
- candidate-only transcription/AI
- editor transcoding/storage later

## Design controls

1. multiplex lightweight channel monitors where isolation permits
2. poll offline channels much less frequently than live signal sampling
3. use event-driven online/offline notifications where reliable
4. keep raw telemetry retention short; downsample aggregates
5. run transcription/LLMs only after cheap candidate detection
6. enforce plan concurrency server-side
7. expire abandoned monitoring sessions
8. budget per workspace/day and stop optional intelligence before core monitoring

## Finance metrics

Track:
- channel-hours / plan
- infrastructure cost / channel-hour
- clips generated / channel-hour
- cost / approved clip
- gross margin / plan
- semantic-AI spend / retained clip
