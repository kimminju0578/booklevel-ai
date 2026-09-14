import { toggleLike } from "@/lib/server/community";
import { handle } from "@/lib/server/http";
export async function PUT(request: Request, context: { params: Promise<{ essayId: string }> }) { return handle(request, async () => toggleLike(request, 'essay', (await context.params).essayId)); }
