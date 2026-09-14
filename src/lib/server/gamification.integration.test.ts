import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

const userId = "30000000-0000-4000-8000-000000000001";
const categoryId = "40000000-0000-4000-8000-000000000001";
let database: PGlite;

beforeAll(async () => {
  database = new PGlite({ extensions: { pg_trgm } });
  await database.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create schema extensions;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
  `);
  for (const name of [
    "202609110001_core.sql",
    "202609110002_security_and_transactions.sql",
    "202609110003_catalog.sql",
    "202609110004_essay_fallback.sql",
    "202609110005_discussion_fallback.sql",
    "202609140001_gamification.sql",
    "202609140002_gamification_security.sql",
    "202609140003_initial_season.sql",
  ]) {
    await database.exec(await readFile(new URL(`../../../supabase/migrations/${name}`, import.meta.url), "utf8"));
  }
  await database.query("insert into auth.users(id) values($1)", [userId]);
  await database.query("insert into public.categories(id,slug,name) values($1,'science','과학')", [categoryId]);
});

afterAll(async () => database.close());

describe("gamification aggregation", () => {
  it("records one server-defined reward idempotently", async () => {
    const first = await database.query<{ event_id: string; rating: number }>(
      "select * from public.record_reward($1,'book_completed','book',$2,$3)",
      [userId, "50000000-0000-4000-8000-000000000001", "book-completed-1"],
    );
    const second = await database.query<{ event_id: string; rating: number }>(
      "select * from public.record_reward($1,'book_completed','book',$2,$3)",
      [userId, "50000000-0000-4000-8000-000000000001", "book-completed-1"],
    );
    await database.query(
      "select * from public.record_reward($1,'book_completed','book',$2,$3)",
      [userId, "50000000-0000-4000-8000-000000000002", "book-completed-2"],
    );
    await database.query(
      "select * from public.record_reward($1,'book_completed','book',$2,$3)",
      [userId, "50000000-0000-4000-8000-000000000003", "book-completed-3"],
    );
    const aggregate = await database.query<{ rating: number; tier_key: string }>(
      "select rating,tier_key from public.user_ratings where user_id=$1",
      [userId],
    );
    const unlocked = await database.query<{ key: string }>(
      "select b.key from public.user_badges ub join public.badges b on b.id=ub.badge_id where ub.user_id=$1",
      [userId],
    );
    expect(first.rows[0].rating).toBe(20);
    expect(second.rows[0]).toEqual(first.rows[0]);
    expect(aggregate.rows[0]).toEqual({ rating: 60, tier_key: "reader_2" });
    expect(unlocked.rows.map((row) => row.key)).toContain("first_book");
  });

  it("refreshes an active season and records the Challenger medal", async () => {
    const season = await database.query<{ id: string }>("select id from public.seasons where status='active'");
    const seasonId = season.rows[0].id;
    await database.query(
      "select * from public.record_reward($1,'assessment_completed','assessment',$2,$3)",
      [userId, "50000000-0000-4000-8000-000000000004", "season-check"],
    );
    const ranking = await database.query<{ rank: number }>(
      "select rank from public.season_rankings where season_id=$1 and user_id=$2",
      [seasonId, userId],
    );
    const medal = await database.query<{ key: string; season_id: string }>(
      "select b.key,ub.season_id from public.user_badges ub join public.badges b on b.id=ub.badge_id where ub.user_id=$1 and ub.season_id=$2",
      [userId, seasonId],
    );
    expect(ranking.rows[0]).toEqual({ rank: 1 });
    expect(medal.rows[0]).toEqual({ key: "season_challenger", season_id: seasonId });
  });
});
