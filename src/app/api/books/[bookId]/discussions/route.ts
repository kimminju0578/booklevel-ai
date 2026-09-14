import { discussions } from "@/lib/server/community";
import { handle } from "@/lib/server/http";
export async function GET(request: Request, context: { params: Promise<{ bookId: string }> }) { return handle(request, async () => discussions(request, (await context.params).bookId)); }
export async function POST(request: Request, context: { params: Promise<{ bookId: string }> }) { return handle(request, async () => discussions(request, (await context.params).bookId)); }
