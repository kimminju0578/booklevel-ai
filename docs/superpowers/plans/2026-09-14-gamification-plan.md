# BOOKLEVEL Gamification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서버 검증 RP, 시즌 Tier/Leaderboard, Badge collection과 SVG Rank Mark를 기존 BOOKLEVEL MVP에 연결한다.

**Architecture:** 기존 Supabase RLS/transaction RPC와 server-only domain layer를 유지한다. 활동 Route가 직접 점수를 쓰지 않고 공통 reward service를 호출하며, rank/badge projection은 DB 함수와 제한된 API DTO에서 계산한다. 시각 자산은 `/public/ranks`·`/public/badges`의 코드 생성 SVG와 metadata-driven React renderer로 제공한다.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase PostgreSQL/RLS, Zod 4, Vitest/PGlite, Playwright, inline SVG/CSS.

**Spec:** `docs/superpowers/specs/2026-09-14-gamification-design.md`

## Global Constraints

- Level과 Rank는 서로 다른 테이블·필드·라벨로 유지한다.
- client payload의 points/rating/tier를 신뢰하지 않는다.
- 모든 reward mutation은 server ownership, idempotency, daily cap 검증 후에만 기록한다.
- Challenger는 active season Top 100 projection으로만 자격을 얻는다.
- Badge는 Emoji/Lucide 단독 아이콘이 아닌 공통 SVG medal/crest family로 구현한다.
- private profile/event/badge data에는 RLS와 owner check를 적용한다.
- 모든 새 계산 함수는 failing unit test를 먼저 작성하고 실행한다.
- 최종적으로 `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`를 실행한다.

### Task 1: Reward and rank domain rules

**Files:**
- Create: `src/lib/gamification/config.ts`
- Create: `src/lib/gamification/scoring.ts`
- Test: `src/lib/gamification/scoring.test.ts`

**Interfaces:**
- `rewardFor(event: RewardEvent, context: RewardContext): RewardDecision`
- `tierForRating(rating: number): TierDefinition`
- `rewriteBonus(previous: number, current: number): number`
- `isChallenger(rank: number | null, seasonStatus: string): boolean`

- [ ] Write tests for exact rewards, cap, diminishing returns, tier boundaries, rewrite max 15, and active-season Top 100.
- [ ] Run `npm test -- src/lib/gamification/scoring.test.ts`; expect failure because the module does not exist.
- [ ] Add config objects for weights, reward rules, caps, and tier thresholds; implement pure functions without database or client dependencies.
- [ ] Run the focused test and then `npm test`; expect all existing and new tests to pass.
- [ ] Refactor only after green; keep literal expected values in tests.

### Task 2: Database schema, RLS, and transactional aggregation

**Files:**
- Create: `supabase/migrations/202609140001_gamification.sql`
- Create: `supabase/migrations/202609140002_gamification_security.sql`
- Modify: `supabase/seed.sql`
- Test: `src/lib/server/gamification.integration.test.ts`

**Interfaces:**
- `public.record_reward(p_user uuid, p_event_type text, p_source_type text, p_source_id uuid, p_idempotency_key text)` returns the accepted event and aggregate.
- `public.get_my_gamification(p_user uuid)` returns rating/tier/progress projection.
- `public.refresh_season_rankings(p_season uuid)` is service-role/admin only.

- [ ] Write a PGlite integration test for one verified activity creating one event, updating rating, and becoming idempotent on retry.
- [ ] Run the test and observe failure because the gamification tables/RPC do not exist.
- [ ] Create `rating_rules`, `user_ratings`, `rating_events`, `rank_tiers`, `seasons`, `season_rankings`, `category_rankings`, `badges`, `user_badges`, `user_equipped_badges`, and `streaks` with FK/check/index/unique constraints.
- [ ] Add server-only RPCs that calculate rewards from stored rules, enforce caps and idempotency, update aggregates, and calculate Challenger from season ranking.
- [ ] Add RLS: owner reads for rating/events/badges/equipment, public limited projections for active leaderboard/badges, and service/admin-only refresh/config mutation.
- [ ] Seed tier definitions, reward rules, badge metadata, and no user-earned rows; run the integration test until green.

### Task 3: Gamification server service and APIs

**Files:**
- Create: `src/lib/server/gamification.ts`
- Create: `src/app/api/ranking/route.ts`
- Create: `src/app/api/ranking/me/route.ts`
- Create: `src/app/api/ranking/category/[categoryId]/route.ts`
- Create: `src/app/api/badges/route.ts`
- Create: `src/app/api/profile/badges/route.ts`
- Create: `src/app/api/profile/badges/equip/route.ts`
- Modify: activity services in `src/lib/server/books.ts`, `src/lib/server/community.ts`, `src/lib/server/essay.ts`, `src/lib/server/assessment.ts`
- Test: `src/lib/server/gamification.integration.test.ts`

**Interfaces:**
- `awardVerifiedActivity(input: VerifiedActivity): Promise<RewardProjection>` derives user identity from session and calls `record_reward`.
- `getRanking(request): Promise<LeaderboardProjection>` exposes public profile fields only.
- `equipBadges(request): Promise<EquippedBadgeProjection>` validates at most three owned badge IDs and one display slot per badge.

- [ ] Add integration cases for review, completed book, essay submit, and rewrite improvement; assert server-defined event types and no client-supplied points.
- [ ] Run the focused integration test and observe failure for missing service/routes.
- [ ] Implement one reward call after each existing verified mutation, preserving the original mutation result when reward calculation is unavailable.
- [ ] Implement GET ranking/me/category, GET badge catalog/profile badges, and POST equipment routes through `handle` with Zod and rate limits.
- [ ] Add public projection filtering and cross-user ownership tests; run full Vitest suite.

### Task 4: SVG Rank Mark, Badge renderer, Profile and leaderboard UI

**Files:**
- Create: `public/ranks/reader.svg`, `public/ranks/explorer.svg`, `public/ranks/scholar.svg`, `public/ranks/expert.svg`, `public/ranks/master.svg`, `public/ranks/grandmaster.svg`, `public/ranks/challenger.svg`
- Create: `public/badges/manifest.json`
- Create: `src/components/gamification/rank-mark.tsx`
- Create: `src/components/gamification/badge-art.tsx`
- Create: `src/components/gamification/trophy-cabinet.tsx`
- Create: `src/components/gamification/leaderboard.tsx`
- Modify: `src/components/dashboard/profile-client.tsx`, `src/components/community/cards.tsx`, `src/components/community/community-client.tsx`
- Modify: `src/app/profile/page.tsx`
- Create: `src/app/ranking/page.tsx`
- Create: `src/app/badges/page.tsx`
- Create: `src/components/gamification/badge-detail-modal.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/e2e/gamification.spec.ts`

**Interfaces:**
- `<RankMark tier="master_2" challengerRank={null} size="sm" />` renders accessible SVG mark plus text fallback.
- `<BadgeArt visual={BadgeVisual} size="full" />` renders the same visual family at 16/24/32/64/128/256px.
- `<TrophyCabinet owned={...} total={...} />` renders collection progress and three equip slots.

- [ ] Write browser assertions for profile Tier/RP, rank mark accessible label, cabinet progress, leaderboard privacy, and badge detail.
- [ ] Run `npm run test:e2e -- tests/e2e/gamification.spec.ts`; expect failure because routes/components do not exist.
- [ ] Add shared SVG geometry and metadata-driven family/symbol/color/rarity rendering; avoid emoji and single-icon placeholders.
- [ ] Connect profile/ranking/badge pages to APIs with loading, empty, retry, and error states; add 3-slot equipment interactions.
- [ ] Add muted unlock reveal under two seconds and `prefers-reduced-motion` behavior; run E2E until green.

### Task 5: Activity ceremony, docs, and final QA

**Files:**
- Modify: `src/components/books/database-book-details.tsx`, `src/components/essay/essay-workspace.tsx`, `src/components/community/community-client.tsx`
- Modify: `docs/API.md`, `docs/DATABASE.md`, `docs/IMPLEMENTATION_REPORT.md`, `docs/TASKS.md`, `README.md`
- Test: `tests/e2e/mvp.spec.ts`, `tests/e2e/gamification.spec.ts`

**Interfaces:**
- Existing activity forms remain functional and show a non-blocking reward projection after successful server mutation.
- Profile and leaderboard use the same `RankMark`/`BadgeArt` visual metadata.

- [ ] Add an unlock panel for tier promotion and rare badge acquisition without blocking the user’s activity result.
- [ ] Add documentation for reward rules, privacy, API payloads, migration order, and required staging verification.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e`; fix root causes without deleting flows.
- [ ] Run `git diff --check` and review changed files for secret values, fake seed records, raw error leakage, and client-controlled points.
