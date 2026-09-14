import { reviewAction } from "@/lib/server/community";
import { handle } from "@/lib/server/http";
export async function PATCH(request: Request, context: { params: Promise<{ reviewId: string }> }) { return handle(request, async () => reviewAction(request, (await context.params).reviewId, 'review')); }
export async function DELETE(request: Request, context: { params: Promise<{ reviewId: string }> }) { return handle(request, async () => reviewAction(request, (await context.params).reviewId, 'review')); }
