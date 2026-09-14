import { retryEssayEvaluation } from "@/lib/server/essay";
import { handle } from "@/lib/server/http";
export async function POST(request: Request, context: { params: Promise<{ essayId: string }> }) { return handle(request, async () => retryEssayEvaluation(request, (await context.params).essayId)); }
