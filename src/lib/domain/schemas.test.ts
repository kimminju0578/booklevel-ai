import { describe, expect, it } from "vitest";
import { evaluationSchema, generateQuestionInput } from "./schemas";

const validEvaluation = {
  scores: {
    understanding: 12,
    thesis: 12,
    reasoning: 16,
    evidence: 12,
    counterargument: 12,
    structure: 8,
    expression: 8,
    total: 80,
  },
  strengths: ["주장이 분명합니다."],
  weaknesses: ["반론 근거를 보강하세요."],
  rewrite_goal: "반론과 재반론의 연결을 강화합니다.",
  guiding_question: "반대 입장에서 가장 강한 근거는 무엇인가요?",
};

describe("AI output schemas", () => {
  it("accepts a rubric whose seven scores sum to the total", () => {
    expect(evaluationSchema.parse(validEvaluation).scores.total).toBe(80);
  });

  it("rejects a total that disagrees with rubric scores", () => {
    expect(() =>
      evaluationSchema.parse({
        ...validEvaluation,
        scores: { ...validEvaluation.scores, total: 81 },
      }),
    ).toThrow("평가 점수 합계가 일치하지 않습니다.");
  });

  it("requires a verified book id for book-based prompts", () => {
    expect(
      generateQuestionInput.safeParse({
        difficulty: 3,
        practiceType: "book_based",
      }).success,
    ).toBe(false);
  });
});
