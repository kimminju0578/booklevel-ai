import {
  MAX_REWRITE_BONUS,
  RANK_TIERS,
  REWARD_RULES,
  type RewardEventType,
  type TierDefinition,
} from "./config";

export type RewardContext = {
  dailyCount: number;
  sameSourceCount: number;
  qualityPassed: boolean;
  uniqueActivity: boolean;
};

export function rewardFor(event: RewardEventType, context: RewardContext): number {
  const rule = REWARD_RULES[event];
  if (rule.qualityRequired && !context.qualityPassed) return 0;
  if (rule.uniqueOnly && !context.uniqueActivity) return 0;
  if (context.sameSourceCount > 0 && event !== "discussion_reply") return 0;
  if (context.dailyCount < rule.dailyCap) return rule.points;
  if (context.dailyCount < rule.dailyCap + rule.reducedRewards) return Math.ceil(rule.points / 2);
  return 0;
}

export function tierForRating(rating: number): TierDefinition {
  const safeRating = Number.isFinite(rating) ? Math.max(0, rating) : 0;
  return [...RANK_TIERS].reverse().find((tier) => tier.key !== "challenger" && safeRating >= tier.minRating) ?? RANK_TIERS[0];
}

export function isChallenger(rank: number | null, seasonStatus: string): boolean {
  return seasonStatus === "active" && rank !== null && rank >= 1 && rank <= 100;
}

export function rewriteBonus(previous: number, current: number): number {
  return Math.min(MAX_REWRITE_BONUS, Math.max(0, Math.floor(current - previous)));
}
