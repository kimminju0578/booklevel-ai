import { z } from "zod";
import { tasteAnswerSchema, tasteQuestionVersion } from "./config";

const payloadSchema = z
  .object({ v: z.literal(tasteQuestionVersion), answers: tasteAnswerSchema })
  .strict();
function base64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeBase64Url(value: string) {
  return atob(
    value.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (value.length % 4)) % 4),
  );
}
export function encodeTastePayload(answers: Record<string, number>) {
  return base64Url(
    JSON.stringify(payloadSchema.parse({ v: tasteQuestionVersion, answers })),
  );
}
export function decodeTastePayload(value: string) {
  return payloadSchema.parse(JSON.parse(decodeBase64Url(value)));
}
export function tasteShareUrl(origin: string, answers: Record<string, number>) {
  return `${origin}/taste/result?data=${encodeURIComponent(encodeTastePayload(answers))}`;
}

const dimensionLabel: Record<string, string> = {
  pace: "전개 속도",
  ambiguity: "열린 해석",
  realism: "현실 기반",
  emotionality: "감정 몰입",
  intellectual_depth: "사고의 깊이",
  practical_vs_conceptual: "개념적 관점",
  breadth_vs_depth: "한 분야 깊이",
  plot_vs_character: "인물 중심",
};

function escapeSvg(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character] || character,
  );
}

const characterCrop: Record<string, [number, number]> = {
  reflective_explorer: [0, 0],
  knowledge_seeker: [1, 0],
  realist_analyst: [2, 0],
  emotional_immersive: [3, 0],
  story_collector: [0, 1],
  intellectual_adventurer: [1, 1],
  deep_reader: [2, 1],
  perspective_connector: [3, 1],
};

export function tasteResultSvg(
  profile: {
    archetype: { key?: string; name: string; shortDescription: string };
    dimensions: Record<string, number>;
  },
  characterHref?: string,
) {
  const bars = Object.entries(profile.dimensions)
    .map(([key, value], index) => {
      const y = 292 + index * 28;
      return `<text x="72" y="${y}" fill="#294353" font-size="14">${escapeSvg(dimensionLabel[key] || key)}</text><rect x="250" y="${y - 14}" width="500" height="10" rx="5" fill="#e1e9ec"/><rect x="250" y="${y - 14}" width="${Math.round(value * 5)}" height="10" rx="5" fill="#6d9db7"/><text x="790" y="${y}" text-anchor="end" fill="#294353" font-size="14">${value}</text>`;
    })
    .join("");
  const [column, row] = characterCrop[profile.archetype.key || ""] || [0, 0];
  const character = characterHref
    ? `<clipPath id="character-crop"><rect x="650" y="34" width="215" height="215" rx="24"/></clipPath><image href="${characterHref}" x="${650 - column * 240}" y="${34 - row * 240}" width="960" height="480" preserveAspectRatio="none" clip-path="url(#character-crop)"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" rx="28" fill="#f7f5f0"/>${character}<text x="72" y="76" fill="#6d9db7" font-size="15" letter-spacing="3">MY READING TASTE</text><text x="72" y="150" fill="#294353" font-size="42" font-weight="700">${escapeSvg(profile.archetype.name)}</text><text x="72" y="190" fill="#60727b" font-size="18">${escapeSvg(profile.archetype.shortDescription)}</text><line x1="72" y1="230" x2="828" y2="230" stroke="#dbe3e6"/>${bars}<text x="72" y="555" fill="#6d9db7" font-size="14">booklevel.ai</text></svg>`;
}
