import { z } from "zod";
import { tasteAnswerSchema, tasteQuestionVersion } from "./config";

const payloadSchema = z.object({ v: z.literal(tasteQuestionVersion), answers: tasteAnswerSchema }).strict();
function base64Url(value: string) { return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function decodeBase64Url(value: string) { return atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4)); }
export function encodeTastePayload(answers: Record<string, number>) { return base64Url(JSON.stringify(payloadSchema.parse({ v: tasteQuestionVersion, answers }))); }
export function decodeTastePayload(value: string) { return payloadSchema.parse(JSON.parse(decodeBase64Url(value))); }
export function tasteShareUrl(origin: string, answers: Record<string, number>) { return `${origin}/taste/result?data=${encodeURIComponent(encodeTastePayload(answers))}`; }

function escapeSvg(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] || character);
}

export function tasteResultSvg(profile: { archetype: { name: string; shortDescription: string }; dimensions: Record<string, number> }) {
  const bars = Object.entries(profile.dimensions).map(([key, value], index) => {
    const y = 290 + index * 28;
    return `<text x="72" y="${y}" fill="#294353" font-size="14">${escapeSvg(key.replaceAll("_", " "))}</text><rect x="220" y="${y - 14}" width="560" height="10" rx="5" fill="#e1e9ec"/><rect x="220" y="${y - 14}" width="${Math.round(value * 5.6)}" height="10" rx="5" fill="#6d9db7"/><text x="800" y="${y}" text-anchor="end" fill="#294353" font-size="14">${value}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" rx="28" fill="#f7f5f0"/><text x="72" y="76" fill="#6d9db7" font-size="15" letter-spacing="3">MY READING TASTE</text><text x="72" y="150" fill="#294353" font-size="42" font-weight="700">${escapeSvg(profile.archetype.name)}</text><text x="72" y="190" fill="#60727b" font-size="18">${escapeSvg(profile.archetype.shortDescription)}</text><line x1="72" y1="230" x2="828" y2="230" stroke="#dbe3e6"/>${bars}<text x="72" y="555" fill="#6d9db7" font-size="14">booklevel.ai</text></svg>`;
}
