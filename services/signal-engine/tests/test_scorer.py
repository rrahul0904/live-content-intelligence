import pytest
from pydantic import ValidationError
from signal_engine import DEFAULT_PRESETS, SignalVector, score

def test_high_signal_vector_triggers():
    vector = SignalVector(
        chat_velocity=.95, keyword_intensity=.85, emote_burst=.8,
        sentiment_intensity=.7, audio_spike=.98, viewer_spike=.75, silence_burst=.6
    )
    decision = score(vector, DEFAULT_PRESETS["default"])
    assert decision.triggered is True
    assert decision.score >= decision.threshold
    assert set(decision.contributions) == set(vector.model_fields)

def test_low_signal_vector_does_not_trigger():
    vector = SignalVector(
        chat_velocity=.1, keyword_intensity=.1, emote_burst=.1,
        sentiment_intensity=.1, audio_spike=.1, viewer_spike=.1, silence_burst=.1
    )
    assert score(vector, DEFAULT_PRESETS["default"]).triggered is False

def test_signal_range_is_enforced():
    with pytest.raises(ValidationError):
        SignalVector(
            chat_velocity=1.5, keyword_intensity=0, emote_burst=0,
            sentiment_intensity=0, audio_spike=0, viewer_spike=0, silence_burst=0
        )
