import { searchBooks } from "@/lib/server/catalog";
import { handle } from "@/lib/server/http";
export async function GET(request: Request) { return handle(request, () => searchBooks(request)); }
