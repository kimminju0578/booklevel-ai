import { describe, expect, it } from "vitest";
import {
  isChallenger,
  rewardFor,
  rewriteBonus,
  tierForRating,
} from "./scoring";

describe("BOOKLEVEL reward rules", () => {
  it("awards the configured first completion reward", () => {
    expect(
      rewardFor("book_completed", {
        dailyCount: 0,
        sameSourceCount: 0,
        qualityPassed: true,
        uniqueActivity: true,
      }),
    ).toBe(20);
  });

  it("caps repeated completion rewards after three full rewards and three reduced rewards", () => {
    const context = { sameSourceCount: 0, qualityPassed: true, uniqueActivity: true };
    expect(rewardFor("book_completed", { ...context, dailyCount: 2 })).toBe(20);
    expect(rewardFor("book_completed", { ...context, dailyCount: 3 })).toBe(10);
    expect(rewardFor("book_completed", { ...context, dailyCount: 6 })).toBe(0);
  });

  it("does not reward a review below the quality threshold", () => {
    expect(
      rewardFor("review_created", {
        dailyCount: 0,
        sameSourceCount: 0,
        qualityPassed: false,
        uniqueActivity: true,
      }),
    ).toBe(0);
  });
});

describe("rank progression", () => {
  it("keeps tier changes in the config-defined order", () => {
    expect(tierForRating(0).key).toBe("reader_1");
    expect(tierForRating(90).key).toBe("reader_3");
    expect(tierForRating(2500).label).toBe("Master II");
    expect(tierForRating(7200).key).toBe("grandmaster");
  });

  it("requires a current-season top-100 result for Challenger", () => {
    expect(isChallenger(100, "active")).toBe(true);
    expect(isChallenger(101, "active")).toBe(false);
    expect(isChallenger(1, "completed")).toBe(false);
    expect(isChallenger(null, "active")).toBe(false);
  });
});

describe("rewrite progression", () => {
  it("turns meaningful improvement into a bounded bonus", () => {
    expect(rewriteBonus(62, 78)).toBe(15);
    expect(rewriteBonus(72, 78)).toBe(6);
    expect(rewriteBonus(80, 78)).toBe(0);
  });
});
