import { autosaveEssay } from "@/lib/server/essay";
import { handle } from "@/lib/server/http";
export async function PUT(request: Request, context: { params: Promise<{ attemptId: string }> }) { return handle(request, async () => autosaveEssay(request, (await context.params).attemptId)); }
