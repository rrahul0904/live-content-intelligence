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

export interface StreamSummary {
  id: string;
  gameName: string;
  title: string;
  viewerCount: number;
  startedAt: string;
}

export interface ConfiguredChannel {
  id: string;
  providerChannelId: string;
  login: string;
  displayName: string;
  profileImageUrl?: string | null;
  preset: string;
  threshold: number;
  enabled: boolean;
  live: boolean;
  stream: StreamSummary | null;
}

export interface ChannelRegistry {
  plan: string;
  channelLimit: number;
  enabledCount: number;
  channels: ConfiguredChannel[];
}
