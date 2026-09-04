# Data Model

PostgreSQL is the durable source of truth. Redis contains only reconstructable runtime state.

Core entities:
- users / oauth_credentials
- channels / user_channels
- monitor_sessions
- channel_profiles / detector_versions
- signal_samples
- clips / clip_signals / clip_feedback
- subscriptions
- broadcaster_opt_outs

## Data rules

1. Access/refresh tokens must be encrypted before insertion.
2. Raw full-stream media is not persisted by default.
3. Signal samples can be downsampled after a retention period.
4. Clip feature vectors are retained because they are training/evaluation data.
5. Feedback is append-only.
6. Detector version is stored on every triggered clip.
7. Deleting a user removes personal data while preserving only legally/operationally permitted anonymous aggregates.

The executable starting migration is in `packages/database/migrations/001_init.sql`.
