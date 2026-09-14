import { readingStatus } from "@/lib/server/books";
import { handle } from "@/lib/server/http";
export async function PUT(request: Request, context: { params: Promise<{ bookId: string }> }) { return handle(request, async () => readingStatus(request, (await context.params).bookId)); }
