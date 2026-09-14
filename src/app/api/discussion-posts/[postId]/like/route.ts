import { toggleLike } from "@/lib/server/community";
import { handle } from "@/lib/server/http";
export async function PUT(request: Request, context: { params: Promise<{ postId: string }> }) { return handle(request, async () => toggleLike(request, 'discussion_post', (await context.params).postId)); }
