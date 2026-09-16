import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const userId = "10000000-0000-4000-8000-000000000001";
const otherUserId = "10000000-0000-4000-8000-000000000002";
const categoryId = "20000000-0000-4000-8000-000000000001";
let database: PGlite;

async function migration(name: string) {
  return readFile(new URL(`../../../supabase/migrations/${name}`, import.meta.url), "utf8");
}

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
    "202609160010_reading_taste_test.sql",
    "202609160011_verified_book_taste_profiles.sql",
  ]) await database.exec(await migration(name));
  await database.query(
    "insert into auth.users(id,raw_user_meta_data) values($1,$2::jsonb)",
    [userId, JSON.stringify({ display_name: "통합 테스트 독자" })],
  );
  await database.query(
    "insert into auth.users(id,raw_user_meta_data) values($1,$2::jsonb)",
    [otherUserId, JSON.stringify({ display_name: "다른 독자" })],
  );
  await database.query(
    "insert into public.categories(id,slug,name) values($1,'economics','경제')",
    [categoryId],
  );
});

afterAll(async () => database.close());

describe("transactional MVP flows", () => {
  it("creates a profile and replaces ordered interests", async () => {
    await database.query("select public.set_interests($1,$2::uuid[])", [userId, [categoryId]]);
    const profile = await database.query<{ display_name: string }>(
      "select display_name from public.profiles where id=$1",
      [userId],
    );
    const interests = await database.query<{ priority: number }>(
      "select priority from public.user_interests where user_id=$1",
      [userId],
    );
    expect(profile.rows[0].display_name).toBe("통합 테스트 독자");
    expect(interests.rows).toEqual([{ priority: 1 }]);
  });

  it("submits exactly ten snapshotted questions and stores level five", async () => {
    await database.query(`
      insert into public.assessment_questions(category_id,level,topic,question,options,correct_option,explanation,is_active)
      select $1,level,'topic-'||level,'question-'||level||'-'||copy,
        '[{"id":"A","text":"A"},{"id":"B","text":"B"},{"id":"C","text":"C"},{"id":"D","text":"D"}]'::jsonb,
        'A','explanation',true
      from generate_series(1,5) level cross join generate_series(1,2) copy
    `, [categoryId]);
    const started = await database.query<{ id: string; question_snapshot: unknown[] }>(
      "select (public.start_assessment($1,$2)).*",
      [userId, categoryId],
    );
    const attempt = started.rows[0];
    expect(attempt.question_snapshot).toHaveLength(10);
    const answers = attempt.question_snapshot.map((question) => ({
      questionId: (question as { id: string }).id,
      selectedOption: "A",
    }));
    const submitted = await database.query<{ calculated_level: number }>(
      "select (public.submit_assessment($1,$2,$3::jsonb)).calculated_level",
      [userId, attempt.id, JSON.stringify(answers)],
    );
    const saved = await database.query<{ level: number }>(
      "select level from public.user_category_levels where user_id=$1 and category_id=$2",
      [userId, categoryId],
    );
    expect(Number(submitted.rows[0].calculated_level)).toBe(5);
    expect(Number(saved.rows[0].level)).toBe(5);
  });

  it("autosaves, submits, and creates a linear rewrite chain", async () => {
    const question = await database.query<{ id: string }>(
      "insert into public.essay_questions(category_id,question,difficulty,source,practice_type) values($1,'근거와 반론을 포함해 논술하세요.',3,'admin','topic_based') returning id",
      [categoryId],
    );
    const started = await database.query<{ start_essay: string }>(
      "select public.start_essay($1,$2,'timed',600)",
      [userId, question.rows[0].id],
    );
    const attemptId = started.rows[0].start_essay;
    const autosaved = await database.query<{ revision: number }>(
      "select (public.autosave_essay($1,$2,'작성 중인 논술 초안입니다.',0)).revision",
      [userId, attemptId],
    );
    expect(autosaved.rows[0].revision).toBe(1);
    const submitted = await database.query<{ id: string; revision: number }>(
      "select (public.submit_essay($1,$2,'주장과 근거, 반론과 재반론을 포함한 최종 논술 답안입니다.',1)).*",
      [userId, attemptId],
    );
    const essay = submitted.rows[0];
    expect(essay.revision).toBe(2);
    await database.query(`
      insert into public.essay_evaluations(
        essay_id,understanding_score,thesis_score,reasoning_score,evidence_score,
        counterargument_score,structure_score,expression_score,total_score,
        strengths,weaknesses,rewrite_goal,guiding_question,time_feedback,model,prompt_version
      ) values($1,12,12,16,12,12,8,8,80,'["강점"]','["보완점"]','목표','질문','시간','test','v1')
    `, [essay.id]);
    const rewritten = await database.query<{ rewrite_essay: string }>(
      "select public.rewrite_essay($1,$2)",
      [userId, essay.id],
    );
    const chain = await database.query<{ version: number; previous_essay_id: string }>(
      "select version,previous_essay_id from public.essays where attempt_id=$1",
      [rewritten.rows[0].rewrite_essay],
    );
    expect(chain.rows[0]).toEqual({ version: 2, previous_essay_id: essay.id });
  });

  it("does not expose private essays or assessment snapshots across users", async () => {
    const question = await database.query<{ id: string }>(
      "insert into public.essay_questions(category_id,question,difficulty,source,practice_type) values($1,'다른 사용자의 비공개 논제입니다.',2,'admin','topic_based') returning id",
      [categoryId],
    );
    const started = await database.query<{ start_essay: string }>(
      "select public.start_essay($1,$2,'practice',null)",
      [userId, question.rows[0].id],
    );
    await database.query("select set_config('request.jwt.claim.sub',$1,false)", [otherUserId]);
    await database.query("set role authenticated");
    let privateEssays;
    let privateAttempts;
    let snapshotAccess: unknown;
    try {
      privateEssays = await database.query("select id from public.essays");
      privateAttempts = await database.query("select id from public.assessment_attempts");
      try {
        await database.query("select question_snapshot from public.assessment_attempts");
      } catch (error) {
        snapshotAccess = error;
      }
    } finally {
      await database.query("reset role");
    }
    expect(privateEssays.rows).toEqual([]);
    expect(privateAttempts.rows).toEqual([]);
    expect(String(snapshotAccess)).toContain("permission denied");
    expect(started.rows[0].start_essay).toBeTruthy();
  });

  it("stores a completed reading taste profile atomically", async () => {
    const answers = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [
      `70000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      4,
    ]));
    const completed = await database.query<{ complete_taste_test: string }>(
      "select public.complete_taste_test($1,$2,$3::jsonb,$4)",
      [userId, 1, JSON.stringify(answers), "reflective_explorer"],
    );
    const profile = await database.query<{ archetype_key: string; dimensions: Record<string, number> }>(
      "select archetype_key, dimensions from public.user_taste_profiles where user_id=$1",
      [userId],
    );
    const savedAnswers = await database.query<{ count: string }>(
      "select count(*)::text from public.taste_test_answers where attempt_id=$1",
      [completed.rows[0].complete_taste_test],
    );
    expect(profile.rows[0].archetype_key).toBe("reflective_explorer");
    expect(Object.keys(profile.rows[0].dimensions)).toHaveLength(8);
    expect(savedAnswers.rows[0].count).toBe("12");
  });
});
