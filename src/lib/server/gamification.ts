import "server-only";

import { z } from "zod";
import { uuid } from "@/lib/domain/schemas";
import { RANK_TIERS } from "@/lib/gamification/config";
import { isChallenger } from "@/lib/gamification/scoring";
import { adminDb, identity, requireUser } from "./db";
import { ApiError, checked } from "./errors";
import { body, event, rateLimit } from "./http";

const eventInput = z.object({
  eventType: z.enum([
    "book_saved", "book_started", "book_completed", "assessment_completed", "review_created", "review_helpful_milestone",
    "discussion_joined", "discussion_reply", "essay_submitted", "essay_evaluated_high",
    "rewrite_completed", "rewrite_improved", "streak_7", "streak_30",
  ]),
  sourceType: z.string().trim().min(1).max(40),
  sourceId: uuid.nullable(),
  idempotencyKey: z.string().trim().min(1).max(160),
  qualityPassed: z.boolean().default(true),
});

export type VerifiedActivity = z.infer<typeof eventInput>;

export async function awardVerifiedActivity(userId: string, input: VerifiedActivity) {
  const value = eventInput.parse(input);
  if (!value.qualityPassed) return null;
  try {
    const result = checked(
      await adminDb().rpc("record_reward", {
        p_user: userId,
        p_event_type: value.eventType,
        p_source_type: value.sourceType,
        p_source_id: value.sourceId,
        p_idempotency_key: value.idempotencyKey,
      }),
    );
    await event(userId, "rating_earned", { eventType: value.eventType, points: result?.points ?? 0 });
    const streak = checked(await adminDb().rpc("record_streak_activity", { p_user: userId }));
    if (streak === 7 || streak === 30) {
      await adminDb().rpc("record_reward", {
        p_user: userId,
        p_event_type: streak === 7 ? "streak_7" : "streak_30",
        p_source_type: "streak",
        p_source_id: null,
        p_idempotency_key: `streak-${streak}:${userId}`,
      });
    }
    return result;
  } catch (error) {
    console.warn(JSON.stringify({ event: "rating_reward_failed", eventType: value.eventType, code: error instanceof ApiError ? error.code : "INTERNAL_ERROR" }));
    return null;
  }
}

function progress(rating: number, currentKey: string) {
  const index = RANK_TIERS.findIndex((tier) => tier.key === currentKey);
  const current = RANK_TIERS[index >= 0 ? index : 0];
  const next = RANK_TIERS.slice(index + 1).find((tier) => tier.key !== "challenger") ?? null;
  const ratio = next ? Math.min(1, Math.max(0, (rating - current.minRating) / Math.max(1, next.minRating - current.minRating))) : 1;
  return { current, next, ratio };
}

export async function rankingMe() {
  const { user } = await requireUser();
  const database = adminDb();
  const ratingRow = checked(await database.from("user_ratings").select("rating,tier_key,current_season_rank").eq("user_id", user.id).maybeSingle());
  const rating = ratingRow?.rating ?? 0;
  const tier = progress(rating, ratingRow?.tier_key ?? "reader_1");
  const season = checked(await database.from("seasons").select("id,name,status").eq("status", "active").maybeSingle());
  const categoryRanks = season ? checked(await database.from("category_rankings").select("category_id,rank,rating,categories(name,slug)").eq("season_id", season.id).eq("user_id", user.id)) : [];
  const badges = checked(await database.from("user_equipped_badges").select("slot,user_badges(id,earned_at,badges(key,name,description,family,rarity,icon_key,mark_asset_url,full_asset_url))").eq("user_id", user.id).order("slot")) ?? [];
  const challenger = Boolean(season && isChallenger(ratingRow?.current_season_rank ?? null, String(season.status)));
  return {
    rating,
    tier: { key: challenger ? "challenger" : tier.current.key, label: challenger ? "Challenger" : tier.current.label, division: challenger ? "Challenger" : tier.current.division },
    nextTier: tier.next ? { key: tier.next.key, label: tier.next.label, minRating: tier.next.minRating } : null,
    progressRatio: tier.ratio,
    season: season ? { id: season.id, name: season.name, rank: ratingRow?.current_season_rank ?? null } : null,
    categoryRanks,
    equippedBadges: badges,
  };
}

export async function ranking(request: Request) {
  const { user } = await identity(false);
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId");
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20));
  const database = adminDb();
  const season = checked(await database.from("seasons").select("id,name,status,starts_at,ends_at").eq("status", "active").maybeSingle());
  if (!season) return { season: null, rows: [], viewer: null };
  const query = categoryId
    ? database.from("category_rankings").select("rank,rating,user_id,profiles(id,display_name,avatar_url)").eq("season_id", season.id).eq("category_id", uuid.parse(categoryId)).order("rank").limit(limit)
    : database.from("season_rankings").select("rank,rating,user_id,profiles(id,display_name,avatar_url)").eq("season_id", season.id).order("rank").limit(limit);
  const rows = checked(await query) ?? [];
  const viewer = user ? rows.find((row) => row.user_id === user.id) ?? null : null;
  const ratingRows = rows.length
    ? checked(await database.from("user_ratings").select("user_id,tier_key,current_season_rank").in("user_id", rows.map((row) => row.user_id))) ?? []
    : [];
  const ratingByUser = new Map(ratingRows.map((row) => [row.user_id, row]));
  return {
    season,
    rows: rows.map((row) => {
      const ratingRow = ratingByUser.get(row.user_id);
      return {
        rank: row.rank,
        rating: row.rating,
        profile: row.profiles,
        rankMark: ratingRow
          ? { tier: ratingRow.tier_key, challengerRank: isChallenger(ratingRow.current_season_rank, season.status) ? ratingRow.current_season_rank : null }
          : null,
      };
    }),
    viewer: viewer ? { rank: viewer.rank, rating: viewer.rating } : null,
  };
}

export async function badgeCatalog() {
  const { db } = await identity(false);
  return { badges: checked(await db.from("badges").select("id,key,name,description,family,rarity,icon_key,mark_asset_url,full_asset_url,series_key,series_order,criteria").eq("is_active", true).order("family").order("series_order")) };
}

export async function profileBadges() {
  const { user } = await requireUser();
  const database = adminDb();
  const owned = checked(await database.from("user_badges").select("id,earned_at,season_id,metadata,badges(id,key,name,description,family,rarity,icon_key,mark_asset_url,full_asset_url,series_key,series_order)").eq("user_id", user.id).order("earned_at", { ascending: false })) ?? [];
  const equipped = checked(await database.from("user_equipped_badges").select("slot,user_badge_id").eq("user_id", user.id).order("slot")) ?? [];
  const totalResult = await database.from("badges").select("id", { count: "exact", head: true }).eq("is_active", true);
  if (totalResult.error) checked(totalResult);
  return { owned, equipped, total: totalResult.count ?? 0 };
}

export async function equipProfileBadges(request: Request) {
  const { user } = await requireUser();
  await rateLimit(request, "badge-equip", user.id, 20, 3600);
  const input = await body(request, z.object({ items: z.array(z.object({ slot: z.number().int().min(1).max(3), userBadgeId: uuid }).strict()).max(3) }).strict());
  if (new Set(input.items.map((item) => item.slot)).size !== input.items.length) throw new ApiError(400, "INVALID_INPUT", "대표 훈장 슬롯을 확인해주세요.");
  checked(await adminDb().rpc("equip_badges", { p_user: user.id, p_items: input.items }));
  return profileBadges();
}
