import { discussionDetail } from "@/lib/server/community";
import { handle } from "@/lib/server/http";
export async function GET(request: Request, context: { params: Promise<{ discussionId: string }> }) { return handle(request, async () => discussionDetail((await context.params).discussionId)); }
