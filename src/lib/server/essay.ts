import "server-only";

import { z } from "zod";
import { structuredAI } from "@/lib/ai/client";
import { essayEvaluationPrompt, essayQuestionPrompt } from "@/lib/ai/prompts";
import {
  draftInput,
  essayStartInput,
  evaluationSchema,
  generateQuestionInput,
  questionSchema,
  submittedDraftInput,
  uuid,
} from "@/lib/domain/schemas";
import { timeFeedback } from "@/lib/domain/scoring";
import { adminDb, identity, requireUser } from "./db";
import { ApiError, checked } from "./errors";
import { awardVerifiedActivity } from "./gamification";
import { body, event, rateLimit } from "./http";

const saveInput = draftInput.omit({ attemptId: true });

export async function essayQuestions(request: Request) {
  const { db, user } = await requireUser();
  const url = new URL(request.url);
  const bookId = url.searchParams.get("bookId");
  const categoryId = url.searchParams.get("categoryId");
  let query = db
    .from("essay_questions")
    .select("id,book_id,category_id,question,difficulty,source,practice_type,target_skill,created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (bookId) query = query.eq("book_id", uuid.parse(bookId));
  if (categoryId) query = query.eq("category_id", uuid.parse(categoryId));
  return { questions: checked(await query), userId: user.id };
}

export async function generateEssayQuestion(request: Request) {
  const { db, user } = await requireUser();
  await rateLimit(request, "essay-question", user.id, 10, 3600);
  const input = await body(request, generateQuestionInput);
  const book = input.bookId
    ? checked(
        await db
          .from("books")
          .select("id,title,authors,publisher,difficulty_level")
          .eq("id", input.bookId)
          .maybeSingle(),
      )
    : null;
  if (input.bookId && !book) throw new ApiError(404, "NOT_FOUND", "책을 찾을 수 없습니다.");
  const category = input.categoryId
    ? checked(
        await db
          .from("categories")
          .select("id,name")
          .eq("id", input.categoryId)
          .maybeSingle(),
      )
    : null;
  if (input.categoryId && !category)
    throw new ApiError(404, "NOT_FOUND", "분야를 찾을 수 없습니다.");
  const topics = book
    ? checked(
        await db
          .from("book_topics")
          .select("topic,importance")
          .eq("book_id", book.id)
          .eq("verified", true)
          .limit(20),
      )
    : [];
  const ai = await structuredAI(
    "essay_question",
    user.id,
    essayQuestionPrompt,
    { book, category, topics, ...input },
    questionSchema,
  );
  const fallback = {
    question: book
      ? `『${book.title}』을 읽으며 중요하다고 판단한 주장 하나를 고르고, 그 주장에 동의하거나 반대하는 이유를 구체적인 근거와 예상 반론을 포함해 논술하세요.`
      : `${category?.name ?? "관심 분야"}에서 최근 접한 주장 하나를 고르고, 그 주장에 동의하거나 반대하는 이유를 구체적인 근거와 예상 반론을 포함해 논술하세요.`,
    goal: "주장, 근거, 반론과 재반론이 연결되는 글을 작성합니다.",
    evaluation_focus: input.targetSkill ? [input.targetSkill] : ["thesis", "reasoning", "counterargument"],
  };
  const generated = ai?.value ?? fallback;
  const created = checked(
    await adminDb()
      .from("essay_questions")
      .insert({
        book_id: input.bookId ?? null,
        category_id: input.categoryId ?? null,
        question: generated.question,
        difficulty: input.difficulty,
        source: ai ? "ai" : "fallback",
        practice_type: input.practiceType,
        target_skill: input.targetSkill ?? null,
        created_by: user.id,
      })
      .select("id,question,difficulty,practice_type,target_skill,source")
      .single(),
  );
  await event(user.id, "essay_question_generated", { questionId: created?.id, source: ai ? "ai" : "fallback" });
  return { question: created, warning: ai ? null : "AI 연결 없이 안전한 기본 논제를 만들었습니다." };
}

export async function startEssay(request: Request) {
  const { user } = await requireUser();
  await rateLimit(request, "essay-start", user.id, 10, 3600);
  const input = await body(request, essayStartInput);
  const attemptId = checked(
    await adminDb().rpc("start_essay", {
      p_user: user.id,
      p_question: input.questionId,
      p_mode: input.mode,
      p_limit: input.timeLimitSeconds,
    }),
  );
  return { attemptId: uuid.parse(attemptId) };
}

export async function essayDraft(attemptId: string) {
  uuid.parse(attemptId);
  const { db, user } = await requireUser();
  const attempt = checked(
    await db
      .from("essay_attempts")
      .select("id,essay_question_id,mode,time_limit_seconds,started_at,submitted_at,elapsed_seconds,overtime_seconds,character_count")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle(),
  );
  if (!attempt) throw new ApiError(404, "NOT_FOUND", "논술 연습을 찾을 수 없습니다.");
  const essay = checked(
    await db
      .from("essays")
      .select("id,content,version,revision,previous_essay_id,is_public,show_score_publicly,evaluation_state,updated_at")
      .eq("attempt_id", attemptId)
      .eq("user_id", user.id)
      .single(),
  );
  const question = checked(
    await db
      .from("essay_questions")
      .select("id,question,difficulty,practice_type,target_skill")
      .eq("id", attempt.essay_question_id)
      .single(),
  );
  const evaluation = essay
    ? checked(
        await db
          .from("essay_evaluations")
          .select("*")
          .eq("essay_id", essay.id)
          .maybeSingle(),
      )
    : null;
  return { attempt, essay, question, evaluation, serverNow: new Date().toISOString() };
}

export async function autosaveEssay(request: Request, attemptId: string) {
  uuid.parse(attemptId);
  const { user } = await requireUser();
  await rateLimit(request, "essay-autosave", user.id, 60, 3600);
  const input = await body(request, saveInput);
  const essay = checked(
    await adminDb().rpc("autosave_essay", {
      p_user: user.id,
      p_attempt: attemptId,
      p_content: input.content,
      p_revision: input.revision,
    }),
  );
  return { essay };
}

async function evaluateEssay(userId: string, essayId: string) {
  const database = adminDb();
  const essay = checked(
    await database
      .from("essays")
      .select("id,attempt_id,content,evaluation_state,evaluation_started_at,previous_essay_id")
      .eq("id", essayId)
      .eq("user_id", userId)
      .single(),
  );
  if (essay?.evaluation_state === "complete") {
    return checked(await database.from("essay_evaluations").select("*").eq("essay_id", essayId).single());
  }
  const staleBefore = new Date(Date.now() - 2 * 60_000).toISOString();
  const lock = checked(
    await database
      .from("essays")
      .update({ evaluation_state: "running", evaluation_started_at: new Date().toISOString() })
      .eq("id", essayId)
      .eq("user_id", userId)
      .or(`evaluation_state.in.(pending,failed),and(evaluation_state.eq.running,evaluation_started_at.lt.${staleBefore})`)
      .select("id")
      .maybeSingle(),
  );
  if (!lock) return null;
  const attempt = checked(
    await database
      .from("essay_attempts")
      .select("essay_question_id,elapsed_seconds,overtime_seconds")
      .eq("id", essay!.attempt_id)
      .eq("user_id", userId)
      .single(),
  );
  const question = checked(
    await database.from("essay_questions").select("question").eq("id", attempt!.essay_question_id).single(),
  );
  const result = await structuredAI(
    "essay_evaluation",
    userId,
    essayEvaluationPrompt,
    { question: question?.question, essay: essay?.content },
    evaluationSchema,
  );
  if (!result) {
    checked(
      await database
        .from("essays")
        .update({ evaluation_state: "failed", evaluation_started_at: null })
        .eq("id", essayId)
        .eq("user_id", userId),
    );
    return null;
  }
  const value = result.value;
  const saved = checked(
    await database
      .from("essay_evaluations")
      .upsert({
        essay_id: essayId,
        understanding_score: value.scores.understanding,
        thesis_score: value.scores.thesis,
        reasoning_score: value.scores.reasoning,
        evidence_score: value.scores.evidence,
        counterargument_score: value.scores.counterargument,
        structure_score: value.scores.structure,
        expression_score: value.scores.expression,
        total_score: value.scores.total,
        strengths: value.strengths,
        weaknesses: value.weaknesses,
        rewrite_goal: value.rewrite_goal,
        guiding_question: value.guiding_question,
        time_feedback: timeFeedback(attempt?.elapsed_seconds ?? 0, attempt?.overtime_seconds ?? 0),
        model: result.model,
        prompt_version: "essay-evaluation-v1",
      })
      .select("*")
      .single(),
  );
  checked(
    await database
      .from("essays")
      .update({ evaluation_state: "complete", evaluation_started_at: null })
      .eq("id", essayId)
      .eq("user_id", userId),
  );
  await event(userId, "essay_evaluated", { essayId, total: value.scores.total });
  await awardVerifiedActivity(userId, {
    eventType: "essay_evaluated_high",
    sourceType: "essay",
    sourceId: essayId,
    idempotencyKey: `essay-evaluated-high:${essayId}`,
    qualityPassed: value.scores.total >= 80,
  });
  if (essay?.previous_essay_id) {
    await awardVerifiedActivity(userId, {
      eventType: "rewrite_completed",
      sourceType: "essay",
      sourceId: essayId,
      idempotencyKey: `rewrite-completed:${essayId}`,
      qualityPassed: true,
    });
    const previousEvaluation = checked(
      await database
        .from("essay_evaluations")
        .select("total_score")
        .eq("essay_id", essay.previous_essay_id)
        .maybeSingle(),
    );
    await awardVerifiedActivity(userId, {
      eventType: "rewrite_improved",
      sourceType: "essay",
      sourceId: essayId,
      idempotencyKey: `rewrite-improved:${essayId}`,
      qualityPassed: Boolean(
        previousEvaluation && value.scores.total >= (previousEvaluation.total_score ?? 0) + 10,
      ),
    });
  }
  return saved;
}

export async function submitEssay(request: Request, attemptId: string) {
  uuid.parse(attemptId);
  const { user } = await requireUser();
  await rateLimit(request, "essay-submit", user.id, 10, 3600);
  const input = await body(request, submittedDraftInput);
  const essay = checked(
    await adminDb().rpc("submit_essay", {
      p_user: user.id,
      p_attempt: attemptId,
      p_content: input.content,
      p_revision: input.revision,
    }),
  );
  const essayId = z.object({ id: uuid }).parse(essay).id;
  await awardVerifiedActivity(user.id, {
    eventType: "essay_submitted",
    sourceType: "essay",
    sourceId: essayId,
    idempotencyKey: `essay-submitted:${essayId}`,
    qualityPassed: input.content.trim().length >= 20,
  });
  const evaluation = await evaluateEssay(user.id, essayId);
  return {
    essayId,
    evaluation,
    warning: evaluation ? null : "답안은 안전하게 저장되었습니다. AI 피드백 연결 후 다시 평가할 수 있어요.",
  };
}

export async function retryEssayEvaluation(request: Request, essayId: string) {
  uuid.parse(essayId);
  const { user } = await requireUser();
  await rateLimit(request, "essay-evaluation", user.id, 5, 3600);
  const evaluation = await evaluateEssay(user.id, essayId);
  return {
    evaluation,
    warning: evaluation ? null : "평가를 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
  };
}

export async function rewriteEssay(request: Request, essayId: string) {
  uuid.parse(essayId);
  const { user } = await requireUser();
  await rateLimit(request, "essay-rewrite", user.id, 10, 3600);
  const attemptId = checked(
    await adminDb().rpc("rewrite_essay", { p_user: user.id, p_essay: essayId }),
  );
  return { attemptId: uuid.parse(attemptId) };
}

export async function essayHistory() {
  const { db, user } = await requireUser();
  return {
    essays: checked(
      await db
        .from("essays")
        .select("id,attempt_id,version,previous_essay_id,is_public,show_score_publicly,evaluation_state,created_at,updated_at,essay_attempts(practice_type,difficulty,elapsed_seconds,overtime_seconds,character_count,submitted_at,essay_question_id),essay_evaluations(total_score,strengths,weaknesses,rewrite_goal,guiding_question,time_feedback)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ),
  };
}

export async function essayVisibility(request: Request, essayId: string) {
  uuid.parse(essayId);
  const { user } = await requireUser();
  const input = await body(
    request,
    z.object({ isPublic: z.boolean(), showScorePublicly: z.boolean() }).strict(),
  );
  if (!input.isPublic && input.showScorePublicly)
    throw new ApiError(400, "INVALID_INPUT", "비공개 글의 점수는 공개할 수 없습니다.");
  const updated = checked(
    await adminDb()
      .from("essays")
      .update({ is_public: input.isPublic, show_score_publicly: input.showScorePublicly })
      .eq("id", essayId)
      .eq("user_id", user.id)
      .select("id,is_public,show_score_publicly")
      .maybeSingle(),
  );
  if (!updated) throw new ApiError(404, "NOT_FOUND", "논술 답안을 찾을 수 없습니다.");
  return updated;
}

export async function publicEssays() {
  const { user } = await identity(false);
  const database = adminDb();
  const blocked = user ? checked(
    await database.from("user_blocks").select("blocked_id").eq("user_id", user.id),
  ) : [];
  let query = database
    .from("essays")
    .select("id,user_id,attempt_id,content,version,show_score_publicly,created_at,profiles(display_name,avatar_url),essay_attempts(character_count,submitted_at,essay_question_id)")
    .eq("is_public", true)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(30);
  const blockedIds = blocked?.map((row) => row.blocked_id) ?? [];
  if (blockedIds.length) query = query.not("user_id", "in", `(${blockedIds.join(",")})`);
  const essays = checked(await query) ?? [];
  const submittedAttemptIds = essays.length
    ? new Set(
        (checked(
          await database
            .from("essay_attempts")
            .select("id")
            .in("id", essays.map((essay) => essay.attempt_id))
            .not("submitted_at", "is", null),
        ) ?? []).map((attempt) => attempt.id),
      )
    : new Set<string>();
  const visible = await Promise.all(
    essays.filter((essay) => submittedAttemptIds.has(essay.attempt_id)).map(async (essay) => ({
      ...essay,
      evaluation: essay.show_score_publicly
        ? checked(
            await database
              .from("essay_evaluations")
              .select("total_score,strengths")
              .eq("essay_id", essay.id)
              .maybeSingle(),
          )
        : null,
    })),
  );
  return { essays: visible };
}
