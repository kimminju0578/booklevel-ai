import { bookDetail } from "@/lib/server/books";
import { handle } from "@/lib/server/http";
export async function GET(request: Request, context: { params: Promise<{ bookId: string }> }) { return handle(request, async () => bookDetail((await context.params).bookId)); }
