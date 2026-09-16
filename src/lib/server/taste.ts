import "server-only";
import { z } from "zod";
import { calculateTasteProfile } from "@/lib/taste/scoring";
import { tasteAnswerSchema, tasteDimensionSchema, tasteQuestions, tasteQuestionVersion, tasteDimensions } from "@/lib/taste/config";
import { bookRow } from "@/lib/domain/schemas";
import { adminDb, identity } from "./db";
import { configured } from "./env";
import { body, event, rateLimit } from "./http";
import { checked } from "./errors";

export const tasteAnswersInput = z.object({ version: z.literal(tasteQuestionVersion), answers: tasteAnswerSchema }).strict();
type TasteBookRow = { book_id: string; dimensions: unknown; confidence: number | string; books: unknown };

export function getTasteQuestions() {
  return { version: tasteQuestionVersion, questions: tasteQuestions.filter((question) => question.active) };
}

export async function completeTasteTest(request: Request) {
  const input = await body(request, tasteAnswersInput);
  const profile = calculateTasteProfile(input.answers);
  let attemptId: string | null = null;
  if (configured()) {
    const { user } = await identity(false);
    if (user) {
      await rateLimit(request, "taste-complete", user.id, 10, 3600);
      attemptId = checked(await adminDb().rpc("complete_taste_test", { p_user: user.id, p_question_version: input.version, p_answers: input.answers, p_archetype_key: profile.archetype.key }));
      await event(user.id, "taste_test_completed", { attemptId, version: input.version });
    }
  }
  return { profile, attemptId };
}

export async function getTasteRecommendations(request: Request) {
  const input = await body(request, tasteAnswersInput);
  const profile = calculateTasteProfile(input.answers);
  if (!configured()) return { books: [], available: false, warning: "도서 추천 연결을 준비하고 있습니다." };
  const database = adminDb();
  const rows = (checked(await database.from("book_taste_profiles").select("book_id,dimensions,confidence,books(*)").eq("review_status", "verified").limit(100)) ?? []) as TasteBookRow[];
  const books = rows.flatMap((row) => {
    const dimensions = tasteDimensionSchema.safeParse(row.dimensions);
    const book = bookRow.safeParse(row.books);
    if (!dimensions.success || !book.success) return [];
    const confidence = Number(row.confidence);
    const match = 0.5 + Math.max(0, Math.min(1, confidence)) * (1 - tasteDimensions.reduce((sum, key) => sum + Math.abs(profile.dimensions[key] - dimensions.data[key]), 0) / (tasteDimensions.length * 100) - 0.5);
    return [{ book: book.data, tasteMatch: Math.max(0, Math.min(1, match)) }];
  }).sort((a, b) => b.tasteMatch - a.tasteMatch || a.book.id.localeCompare(b.book.id)).slice(0, 5);
  await event(null, "taste_result_viewed", { count: books.length, archetype: profile.archetype.key });
  return { books, available: true, profile };
}

export async function getTasteProfile() {
  if (!configured()) return { profile: null, available: false };
  const { user } = await identity(false);
  if (!user) return { profile: null, available: true };
  const profile = checked(await adminDb().from("user_taste_profiles").select("*,reader_archetypes(*)").eq("user_id", user.id).maybeSingle());
  return { profile, available: true };
}
