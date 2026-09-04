# Detection Engine

## Signals

Each observation contains:
- chat_velocity
- keyword_intensity
- emote_burst
- sentiment_intensity
- audio_spike
- viewer_spike
- silence_burst

Each value supplied to the scorer is normalized into a comparable 0..1 range. Raw feature collectors may use z-scores, robust z-scores, EWMA deviations, or percentile transforms before producing those values.

## Formula

```
score = 100 * sum(weight_i * signal_i) / sum(weight_i)
```

A trigger is eligible when:
- score >= threshold
- monitoring session is healthy
- stream is live
- channel is not in cooldown
- candidate idempotency key has not already been consumed

## Cold-start presets

Presets provide initial weights and thresholds for broad content classes. The first implementation should include default, small-streamer, FPS, MOBA, strategy/chess, IRL, variety/chatting, and sports.

## Learning

Do not update historical scores after feedback. Create a new calibration version.

A safe first learner can:
- slightly lower threshold after consistent approvals
- slightly raise threshold after consistent rejections
- adjust weights only within configured bounds
- require a minimum review count
- evaluate the proposed model on prior clips before activation

Later, train `P(approve | features, channel context)` and use it as a second-stage ranker, while retaining the formula as an interpretable first-stage detector.

## Quality evaluation

Track precision@K, approval rate, trigger rate/hour, false-positive reasons, and lift versus the preset baseline.
