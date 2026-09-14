import { postOpinion } from "@/lib/server/community";
import { handle } from "@/lib/server/http";
export async function POST(request: Request, context: { params: Promise<{ discussionId: string }> }) { return handle(request, async () => postOpinion(request, (await context.params).discussionId)); }
