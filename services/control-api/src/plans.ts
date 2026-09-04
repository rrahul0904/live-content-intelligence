import { HttpError } from "./lib/errors.js";

export const PLAN_CHANNEL_LIMITS = {
  free: 1,
  starter: 3,
  pro: 10,
  agency: 50,
  enterprise: 250
} as const;

export type PlanName = keyof typeof PLAN_CHANNEL_LIMITS;

export function normalizePlan(plan: string): PlanName {
  return plan in PLAN_CHANNEL_LIMITS ? (plan as PlanName) : "free";
}

export function channelLimitForPlan(plan: string): number {
  return PLAN_CHANNEL_LIMITS[normalizePlan(plan)];
}

export function assertChannelCapacity(plan: string, enabledCount: number): void {
  const limit = channelLimitForPlan(plan);
  if (enabledCount >= limit) {
    throw new HttpError(
      409,
      "Channel limit reached for " + normalizePlan(plan) + " plan",
      "plan_channel_limit"
    );
  }
}
