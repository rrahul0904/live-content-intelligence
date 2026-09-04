export type SignalName =
  | "chat_velocity"
  | "keyword_intensity"
  | "emote_burst"
  | "sentiment_intensity"
  | "audio_spike"
  | "viewer_spike"
  | "silence_burst";

export type SignalVector = Record<SignalName, number>;

export interface DetectionDecision {
  score: number;
  threshold: number;
  triggered: boolean;
  contributions: Record<SignalName, number>;
  detectorVersion: string;
}

export interface CandidateClip {
  id: string;
  channelId: string;
  capturedAt: string;
  score: number;
  threshold: number;
  reviewState: "pending" | "approved" | "rejected";
}
