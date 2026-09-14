import { submitEssay } from "@/lib/server/essay";
import { handle } from "@/lib/server/http";
export async function POST(request: Request, context: { params: Promise<{ attemptId: string }> }) { return handle(request, async () => submitEssay(request, (await context.params).attemptId)); }
