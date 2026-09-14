import { essayDraft } from "@/lib/server/essay";
import { handle } from "@/lib/server/http";
export async function GET(request: Request, context: { params: Promise<{ attemptId: string }> }) { return handle(request, async () => essayDraft((await context.params).attemptId)); }
