import { essayHistory } from "@/lib/server/essay";
import { handle } from "@/lib/server/http";
export async function GET(request: Request) { return handle(request, essayHistory); }
