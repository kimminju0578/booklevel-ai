import { describe, expect, it } from "vitest";
import { tasteQuestions, tasteDimensions, type TasteDimension } from "./config";
import { calculateTasteProfile, scoreTaste, tasteMatch } from "./scoring";

const answers = Object.fromEntries(tasteQuestions.map((question) => [question.id, 5]));

describe("reading taste scoring", () => {
  it("normalizes all dimensions to 0-100", () => {
    const result = scoreTaste(answers);
    expect(Object.keys(result)).toHaveLength(8);
    expect(Object.values(result).every((value) => value >= 0 && value <= 100)).toBe(true);
  });
  it("rejects incomplete answers", () => {
    expect(() => scoreTaste({})).toThrow();
  });
  it("is deterministic", () => {
    expect(calculateTasteProfile(answers)).toEqual(calculateTasteProfile(answers));
  });
  it("calculates confidence-adjusted taste match", () => {
    const profile = Object.fromEntries(tasteDimensions.map((key) => [key, 50])) as Record<TasteDimension, number>;
    expect(tasteMatch(profile, profile, 1)).toBe(1);
    expect(tasteMatch(profile, Object.fromEntries(tasteDimensions.map((key) => [key, 0])) as Record<TasteDimension, number>, 0)).toBe(0.5);
  });
});
