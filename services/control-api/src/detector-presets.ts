export const DETECTOR_PRESETS = {
  default: { id: "default", threshold: 72 },
  "small-streamer": { id: "small-streamer", threshold: 68 },
  fps: { id: "fps", threshold: 74 },
  moba: { id: "moba", threshold: 74 },
  strategy: { id: "strategy", threshold: 70 },
  irl: { id: "irl", threshold: 70 },
  variety: { id: "variety", threshold: 69 },
  sports: { id: "sports", threshold: 75 }
} as const;

export type PresetId = keyof typeof DETECTOR_PRESETS;

export function isPresetId(value: string): value is PresetId {
  return value in DETECTOR_PRESETS;
}
