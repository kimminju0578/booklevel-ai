import { z } from "zod";
import { readerArchetypes, tasteAnswerSchema, tasteDimensionSchema, tasteDimensions, tasteQuestions, type ReaderArchetype, type TasteDimension, type TasteQuestion } from "./config";

export type TasteAnswers = Record<string, number>;
export type TasteProfile = { dimensions: Record<TasteDimension, number>; archetype: ReaderArchetype };

export function validateTasteAnswers(answers: unknown, questions: TasteQuestion[] = tasteQuestions): TasteAnswers {
  const parsed = tasteAnswerSchema.parse(answers);
  const expected = new Set(questions.filter((q) => q.active).map((q) => q.id));
  const actual = Object.keys(parsed);
  if (actual.length !== expected.size || actual.some((id) => !expected.has(id))) throw new z.ZodError([]);
  return parsed;
}

export function scoreTaste(answers: unknown, questions: TasteQuestion[] = tasteQuestions): Record<TasteDimension, number> {
  const valid = validateTasteAnswers(answers, questions);
  const totals = Object.fromEntries(tasteDimensions.map((key) => [key, { value: 0, weight: 0 }])) as Record<TasteDimension, { value: number; weight: number }>;
  for (const question of questions.filter((q) => q.active)) {
    const normalized = (valid[question.id] - 3) / 2;
    totals[question.dimension].value += normalized * question.direction * question.weight;
    totals[question.dimension].weight += question.weight;
  }
  return tasteDimensionSchema.parse(Object.fromEntries(tasteDimensions.map((key) => [key, Math.round((totals[key].value / totals[key].weight / 2 + 0.5) * 100)])));
}

export function chooseArchetype(dimensions: Record<TasteDimension, number>, archetypes = readerArchetypes): ReaderArchetype {
  return [...archetypes].sort((a, b) => distance(dimensions, a) - distance(dimensions, b) || a.priority - b.priority || a.key.localeCompare(b.key))[0];
}

function distance(dimensions: Record<TasteDimension, number>, archetype: ReaderArchetype) {
  return tasteDimensions.reduce((sum, key) => sum + Math.abs(dimensions[key] - archetype.centroid[key]) * archetype.dimensionWeights[key], 0);
}

export function calculateTasteProfile(answers: unknown, questions: TasteQuestion[] = tasteQuestions): TasteProfile {
  const dimensions = scoreTaste(answers, questions);
  return { dimensions, archetype: chooseArchetype(dimensions) };
}

export function tasteMatch(user: Record<TasteDimension, number>, book: Record<TasteDimension, number>, confidence: number) {
  const raw = 1 - tasteDimensions.reduce((sum, key) => sum + Math.abs(user[key] - book[key]), 0) / (tasteDimensions.length * 100);
  return Math.max(0, Math.min(1, 0.5 + Math.max(0, Math.min(1, confidence)) * (raw - 0.5)));
}
