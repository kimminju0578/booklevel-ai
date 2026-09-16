import { getTasteQuestions } from "@/lib/server/taste";
export async function GET() { return Response.json(getTasteQuestions(), { headers: { "Cache-Control": "public, max-age=3600" } }); }
