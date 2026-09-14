import { describe, expect, it } from "vitest";
import {
  calculateLevel,
  elapsedTime,
  formatDuration,
  interestWeight,
  knowledgeGap,
  recommendationScore,
  timeFeedback,
} from "./scoring";

describe("calculateLevel", () => {
  it.each([
    [0, 100, 1],
    [24, 100, 1],
    [25, 100, 2],
    [45, 100, 3],
    [65, 100, 4],
    [82, 100, 5],
  ])("maps %d/%d to level %d", (earned, maximum, expected) => {
    expect(calculateLevel(earned, maximum)).toBe(expected);
  });

  it("rejects impossible scores", () => {
    expect(() => calculateLevel(11, 10)).toThrow("INVALID_SCORE");
  });
});

describe("recommendation scoring", () => {
  it("ranks a level-matched, high-interest unseen book higher", () => {
    const matched = recommendationScore({
      level: 3,
      difficulty: 3,
      interest: 1,
      gap: 0.7,
      novelty: 1,
    });
    const mismatched = recommendationScore({
      level: 3,
      difficulty: 5,
      interest: 0.5,
      gap: 0.7,
      novelty: 0,
    });
    expect(matched).toBeGreaterThan(mismatched);
  });

  it.each([
    [1, 1],
    [2, 0.8],
    [3, 0.5],
    [undefined, 0.5],
  ])("maps interest priority %s to %s", (priority, expected) => {
    expect(interestWeight(priority)).toBe(expected);
  });

  it("weights knowledge gaps by verified topic importance", () => {
    expect(
      knowledgeGap(
        [
          { topic: "money", importance: 3 },
          { topic: "trade", importance: 1 },
        ],
        { money: 0, trade: 1 },
      ),
    ).toBe(0.75);
  });
});

describe("essay timer", () => {
  it("records elapsed and overtime independently from scoring", () => {
    expect(
      elapsedTime("2026-09-11T00:00:00.000Z", "2026-09-11T00:12:05.000Z", 600),
    ).toEqual({ elapsedSeconds: 725, overtimeSeconds: 125 });
  });

  it("formats a non-negative mm:ss value", () => {
    expect(formatDuration(125)).toBe("02:05");
    expect(formatDuration(-2)).toBe("00:00");
  });

  it("describes overtime without changing the quality score", () => {
    expect(timeFeedback(725, 125)).toBe(
      "12분 5초 동안 작성했고, 제한 시간을 2분 5초 넘겨 마무리했습니다. 작성 시간은 글의 점수에 반영하지 않았습니다.",
    );
  });
});
