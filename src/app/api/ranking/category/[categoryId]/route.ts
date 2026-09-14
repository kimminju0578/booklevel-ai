import { ranking } from "@/lib/server/gamification";
import { handle } from "@/lib/server/http";
export async function GET(request: Request, context: { params: Promise<{ categoryId: string }> }) { return handle(request, async () => { const params = await context.params; const url = new URL(request.url); url.searchParams.set("categoryId", params.categoryId); return ranking(new Request(url, request)); }); }
