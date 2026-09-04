from pydantic import BaseModel, Field, model_validator

class SignalVector(BaseModel):
    chat_velocity: float = Field(ge=0, le=1)
    keyword_intensity: float = Field(ge=0, le=1)
    emote_burst: float = Field(ge=0, le=1)
    sentiment_intensity: float = Field(ge=0, le=1)
    audio_spike: float = Field(ge=0, le=1)
    viewer_spike: float = Field(ge=0, le=1)
    silence_burst: float = Field(ge=0, le=1)

class DetectorPreset(BaseModel):
    name: str
    threshold: float = Field(ge=0, le=100)
    weights: dict[str, float]

    @model_validator(mode="after")
    def validate_weights(self):
        expected = set(SignalVector.model_fields.keys())
        if set(self.weights.keys()) != expected:
            raise ValueError(f"weights must contain exactly: {sorted(expected)}")
        if any(value < 0 for value in self.weights.values()):
            raise ValueError("weights must be non-negative")
        if sum(self.weights.values()) <= 0:
            raise ValueError("at least one weight must be positive")
        return self

class DetectionDecision(BaseModel):
    score: float
    threshold: float
    triggered: bool
    contributions: dict[str, float]
    detector_version: str = "formula-v0.1"
