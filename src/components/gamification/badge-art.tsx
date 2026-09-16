import type { CSSProperties } from "react";

type BadgeArtProps = {
  family?: string | null;
  rarity?: string | null;
  iconKey?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
};

const rarityClass: Record<string, string> = {
  common: "common",
  uncommon: "uncommon",
  rare: "rare",
  epic: "epic",
  legendary: "legendary",
};

const atlasPositions: Record<string, string> = {
  book: "0% 0%",
  "book-laurel": "50% 0%",
  "laurel-star": "100% 0%",
  quill: "0% 50%",
  manuscript: "50% 50%",
  grandmaster: "100% 50%",
  challenger: "0% 100%",
  "layered-crest": "50% 100%",
};

function getAtlasPosition(icon: string, family: string) {
  if (atlasPositions[icon]) return atlasPositions[icon];
  if (family === "essay") return "100% 100%";
  if (family === "ranking" || family === "seasonal") return "50% 100%";
  return "0% 0%";
}

export function BadgeArt({
  family = "knowledge",
  rarity = "common",
  iconKey = "first_book",
  name = "Achievement badge",
  size = "md",
}: BadgeArtProps) {
  const icon = iconKey ?? "first_book";
  const familyKey = family?.toLowerCase() ?? "knowledge";
  const rarityKey = rarityClass[rarity?.toLowerCase() ?? "common"] ?? "common";
  const atlasPosition = getAtlasPosition(icon, familyKey);
  return (
    <span
      className={`badge-art badge-art--${size} badge-art--${rarityKey} badge-art--${familyKey}`}
    >
      <span
        className="badge-art__atlas"
        role="img"
        aria-label={name}
        style={{ "--badge-atlas-position": atlasPosition } as CSSProperties}
      />
      <svg aria-hidden="true" viewBox="0 0 100 112" focusable="false">
        <path className="badge-art__ribbon" d="M25 75h50l-7 28-18-9-18 9z" />
        <path
          className="badge-art__outer"
          d="M50 5 91 21v34c0 26-16 43-41 52C25 98 9 81 9 55V21z"
        />
        <path
          className="badge-art__inner"
          d="M50 13 82 26v28c0 20-12 34-32 43C30 88 18 74 18 54V26z"
        />
        <path
          className="badge-art__ornament"
          d="M24 29 17 23m59 6 7-6M24 83l-7 7m59-7 7 7"
        />
        {icon.includes("book") && (
          <path
            className="badge-art__book"
            d="M29 39c7-4 14-4 21 1v27c-7-4-14-4-21 0zm42 0c-7-4-14-4-21 1v27c7-4 14-4 21 0z"
          />
        )}
        {icon.includes("essay") || icon.includes("rewrite") ? (
          <>
            <path className="badge-art__paper" d="M31 32h32l7 8v29H31z" />
            <path
              className="badge-art__quill"
              d="m65 28-22 39m0-12 10 6m-17 5 8-2"
            />
          </>
        ) : null}
        {icon.includes("discussion") || icon.includes("review") ? (
          <>
            <path
              className="badge-art__speech"
              d="M27 39h27v20H39l-8 7 2-7h-6z"
            />
            <path
              className="badge-art__speech badge-art__speech--second"
              d="M46 48h27v20H58l-8 7 2-7h-6z"
            />
          </>
        ) : null}
        {icon.includes("rank") || icon.includes("season") ? (
          <>
            <path
              className="badge-art__laurel"
              d="M34 67c-9-9-9-22-2-32m34 32c9-9 9-22 2-32"
            />
            <path
              className="badge-art__star"
              d="m50 27 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"
            />
          </>
        ) : null}
        {icon.includes("streak") && (
          <>
            <path
              className="badge-art__star"
              d="m50 25 4 9 10 1-8 6 2 10-8-5-8 5 2-10-8-6 10-1z"
            />
            <circle className="badge-art__dot" cx="35" cy="61" r="3" />
            <circle className="badge-art__dot" cx="50" cy="68" r="3" />
            <circle className="badge-art__dot" cx="65" cy="61" r="3" />
          </>
        )}
        {!icon.includes("book") &&
          !icon.includes("essay") &&
          !icon.includes("rewrite") &&
          !icon.includes("discussion") &&
          !icon.includes("review") &&
          !icon.includes("rank") &&
          !icon.includes("season") &&
          !icon.includes("streak") && (
            <path
              className="badge-art__star"
              d="m50 26 6 13 14 2-10 10 3 14-13-7-13 7 3-14-10-10 14-2z"
            />
          )}
      </svg>
    </span>
  );
}
