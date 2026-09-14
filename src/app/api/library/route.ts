import { library } from "@/lib/server/books";
import { handle } from "@/lib/server/http";
export async function GET(request: Request) { return handle(request, library); }
