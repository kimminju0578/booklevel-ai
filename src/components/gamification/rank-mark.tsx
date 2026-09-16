import type { CSSProperties } from "react";

type RankMarkProps = {
  tier: string;
  challengerRank?: number | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

const labels: Record<string, string> = {
  reader_1: "독자 I",
  reader_2: "독자 II",
  reader_3: "독자 III",
  explorer_1: "탐험가 I",
  explorer_2: "탐험가 II",
  explorer_3: "탐험가 III",
  scholar_1: "학자 I",
  scholar_2: "학자 II",
  scholar_3: "학자 III",
  expert_1: "전문가 I",
  expert_2: "전문가 II",
  expert_3: "전문가 III",
  master_1: "장인 I",
  master_2: "장인 II",
  master_3: "장인 III",
  grandmaster: "대가",
  challenger: "도전자",
};

function tierFamily(tier: string) {
  return (
    tier.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_").split("_")[0] ||
    "reader"
  );
}

export function RankMark({
  tier,
  challengerRank,
  size = "md",
  showLabel = false,
}: RankMarkProps) {
  const family = tierFamily(tier);
  const label = labels[tier.toLowerCase()] ?? tier;
  const markStyle = {
    "--rank-accent": `var(--rank-${family}-accent)`,
  } as CSSProperties;
  const isHigh = ["master", "grandmaster", "challenger"].includes(family);
  const isChallenger = family === "challenger";

  return (
    <span
      className={`rank-mark rank-mark--${size} rank-mark--${family}`}
      style={markStyle}
    >
      <svg
        viewBox="0 0 120 142"
        role="img"
        aria-label={`${label} rank mark`}
        focusable="false"
      >
        <path className="rank-mark__ribbon" d="M23 94h74l-9 31-28-13-28 13z" />
        <path
          className="rank-mark__outer"
          d="M60 6 108 25v38c0 32-20 56-48 69C32 119 12 95 12 63V25z"
        />
        <path
          className="rank-mark__inner"
          d="M60 16 98 31v31c0 25-15 45-38 57C37 107 22 87 22 62V31z"
        />
        <path
          className="rank-mark__ornament"
          d="M27 28 20 22m73 6 7-6M27 91l-7 7m73-7 7 7"
        />
        {isHigh && (
          <path
            className="rank-mark__laurel"
            d="M33 75c-10-12-10-27-2-38m56 38c10-12 10-27 2-38"
          />
        )}
        {isChallenger && (
          <path
            className="rank-mark__crown"
            d="m39 50-7-17 17 10 11-18 11 18 17-10-7 17z"
          />
        )}
        {!isChallenger && family === "reader" && (
          <path
            className="rank-mark__book"
            d="M36 49c8-5 16-5 24 0v31c-8-5-16-5-24 0zm48 0c-8-5-16-5-24 0v31c8-5 16-5 24 0z"
          />
        )}
        {family === "explorer" && (
          <>
            <circle className="rank-mark__compass" cx="60" cy="59" r="21" />
            <path className="rank-mark__needle" d="m60 43 6 16-6 16-6-16z" />
          </>
        )}
        {family === "scholar" && (
          <>
            <path
              className="rank-mark__book"
              d="M37 49c8-5 15-5 23 0v31c-8-5-15-5-23 0zm46 0c-8-5-15-5-23 0v31c8-5 15-5 23 0z"
            />
            <path
              className="rank-mark__star"
              d="m60 34 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"
            />
          </>
        )}
        {family === "expert" && (
          <>
            <path
              className="rank-mark__book"
              d="M38 51c7-4 14-4 22 0v29c-8-4-15-4-22 0zm44 0c-8-4-15-4-22 0v29c8-4 15-4 22 0z"
            />
            <path
              className="rank-mark__star"
              d="m60 28 5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z"
            />
          </>
        )}
        {family === "master" && (
          <>
            <path
              className="rank-mark__book"
              d="M36 52c8-5 16-5 24 0v28c-8-5-16-5-24 0zm48 0c-8-5-16-5-24 0v28c8-5 16-5 24 0z"
            />
            <path
              className="rank-mark__star"
              d="m60 25 5 12 13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1z"
            />
            <circle className="rank-mark__dot" cx="60" cy="61" r="3" />
          </>
        )}
        {family === "grandmaster" && (
          <>
            <path
              className="rank-mark__crown"
              d="m39 54-8-22 19 13 10-22 10 22 19-13-8 22z"
            />
            <path
              className="rank-mark__book"
              d="M38 60c7-4 14-4 22 0v24c-8-4-15-4-22 0zm44 0c-8-4-15-4-22 0v24c8-4 15-4 22 0z"
            />
            <path
              className="rank-mark__star"
              d="m60 40 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
            />
          </>
        )}
        {isChallenger && (
          <>
            <path
              className="rank-mark__star rank-mark__star--large"
              d="m60 57 6 13 14 2-10 10 3 14-13-7-13 7 3-14-10-10 14-2z"
            />
            <text className="rank-mark__rank" x="60" y="82" textAnchor="middle">
              {challengerRank ? `#${challengerRank}` : "TOP 100"}
            </text>
          </>
        )}
      </svg>
      {showLabel && <span className="rank-mark__label">{label}</span>}
    </span>
  );
}
