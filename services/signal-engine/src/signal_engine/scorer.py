from .model import DetectionDecision, DetectorPreset, SignalVector

DEFAULT_WEIGHTS = {
    "chat_velocity": 1.15,
    "keyword_intensity": 1.00,
    "emote_burst": 0.90,
    "sentiment_intensity": 0.85,
    "audio_spike": 1.10,
    "viewer_spike": 1.05,
    "silence_burst": 0.70,
}

DEFAULT_PRESETS = {
    "default": DetectorPreset(name="default", threshold=72, weights=DEFAULT_WEIGHTS),
    "fps": DetectorPreset(
        name="fps",
        threshold=74,
        weights={**DEFAULT_WEIGHTS, "audio_spike": 1.30, "chat_velocity": 1.25},
    ),
    "small-streamer": DetectorPreset(
        name="small-streamer",
        threshold=68,
        weights={**DEFAULT_WEIGHTS, "viewer_spike": 0.75, "keyword_intensity": 1.15},
    ),
}

def score(vector: SignalVector, preset: DetectorPreset) -> DetectionDecision:
    values = vector.model_dump()
    weighted = {key: values[key] * weight for key, weight in preset.weights.items()}
    denominator = sum(preset.weights.values())
    normalized_score = 100 * sum(weighted.values()) / denominator
    contributions = {
        key: round(100 * value / denominator, 2)
        for key, value in weighted.items()
    }
    final_score = round(normalized_score, 2)
    return DetectionDecision(
        score=final_score,
        threshold=preset.threshold,
        triggered=final_score >= preset.threshold,
        contributions=contributions,
    )
