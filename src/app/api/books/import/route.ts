import { importBook } from "@/lib/server/catalog";
import { handle } from "@/lib/server/http";
export async function POST(request: Request) { return handle(request, () => importBook(request)); }
