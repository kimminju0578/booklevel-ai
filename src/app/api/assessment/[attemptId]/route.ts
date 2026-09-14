import { assessmentResult } from "@/lib/server/assessment";
import { handle } from "@/lib/server/http";
export async function GET(request: Request, context: { params: Promise<{ attemptId: string }> }) { return handle(request, async () => assessmentResult((await context.params).attemptId)); }
