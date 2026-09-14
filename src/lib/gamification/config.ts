export const RATING_WEIGHTS = {
  reading: 0.2,
  assessment: 0.2,
  essay: 0.25,
  rewrite: 0.15,
  community: 0.1,
  consistency: 0.1,
} as const;

export type RewardEventType =
  | "book_saved"
  | "book_started"
  | "book_completed"
  | "assessment_completed"
  | "review_created"
  | "review_helpful_milestone"
  | "discussion_joined"
  | "discussion_reply"
  | "essay_submitted"
  | "essay_evaluated_high"
  | "rewrite_completed"
  | "rewrite_improved"
  | "streak_7"
  | "streak_30";

export type RewardRule = {
  points: number;
  dailyCap: number;
  reducedRewards: number;
  qualityRequired?: boolean;
  uniqueOnly?: boolean;
};

export const REWARD_RULES: Record<RewardEventType, RewardRule> = {
  book_saved: { points: 2, dailyCap: 10, reducedRewards: 2, uniqueOnly: true },
  book_started: { points: 3, dailyCap: 3, reducedRewards: 3, uniqueOnly: true },
  book_completed: { points: 20, dailyCap: 3, reducedRewards: 3, uniqueOnly: true },
  assessment_completed: { points: 10, dailyCap: 3, reducedRewards: 0, uniqueOnly: true },
  review_created: { points: 10, dailyCap: 3, reducedRewards: 2, qualityRequired: true, uniqueOnly: true },
  review_helpful_milestone: { points: 5, dailyCap: 1, reducedRewards: 0, uniqueOnly: true },
  discussion_joined: { points: 8, dailyCap: 3, reducedRewards: 2, qualityRequired: true, uniqueOnly: true },
  discussion_reply: { points: 3, dailyCap: 5, reducedRewards: 2, qualityRequired: true },
  essay_submitted: { points: 15, dailyCap: 2, reducedRewards: 1, qualityRequired: true, uniqueOnly: true },
  essay_evaluated_high: { points: 10, dailyCap: 2, reducedRewards: 0, qualityRequired: true, uniqueOnly: true },
  rewrite_completed: { points: 12, dailyCap: 2, reducedRewards: 1, qualityRequired: true, uniqueOnly: true },
  rewrite_improved: { points: 10, dailyCap: 2, reducedRewards: 0, qualityRequired: true, uniqueOnly: true },
  streak_7: { points: 15, dailyCap: 1, reducedRewards: 0, uniqueOnly: true },
  streak_30: { points: 50, dailyCap: 1, reducedRewards: 0, uniqueOnly: true },
};

export type TierDefinition = { key: string; label: string; minRating: number; division: string };

export const RANK_TIERS: readonly TierDefinition[] = [
  { key: "reader_1", label: "Reader I", minRating: 0, division: "Reader" },
  { key: "reader_2", label: "Reader II", minRating: 40, division: "Reader" },
  { key: "reader_3", label: "Reader III", minRating: 90, division: "Reader" },
  { key: "explorer_1", label: "Explorer I", minRating: 170, division: "Explorer" },
  { key: "explorer_2", label: "Explorer II", minRating: 270, division: "Explorer" },
  { key: "explorer_3", label: "Explorer III", minRating: 400, division: "Explorer" },
  { key: "scholar_1", label: "Scholar I", minRating: 580, division: "Scholar" },
  { key: "scholar_2", label: "Scholar II", minRating: 800, division: "Scholar" },
  { key: "scholar_3", label: "Scholar III", minRating: 1080, division: "Scholar" },
  { key: "expert_1", label: "Expert I", minRating: 1300, division: "Expert" },
  { key: "expert_2", label: "Expert II", minRating: 1600, division: "Expert" },
  { key: "expert_3", label: "Expert III", minRating: 2000, division: "Expert" },
  { key: "master_1", label: "Master I", minRating: 2300, division: "Master" },
  { key: "master_2", label: "Master II", minRating: 2500, division: "Master" },
  { key: "master_3", label: "Master III", minRating: 3200, division: "Master" },
  { key: "grandmaster", label: "Grandmaster", minRating: 4800, division: "Grandmaster" },
  { key: "challenger", label: "Challenger", minRating: 0, division: "Challenger" },
] as const;

export const MAX_REWRITE_BONUS = 15;
