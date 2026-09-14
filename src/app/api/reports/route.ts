import { reportContent } from "@/lib/server/community";
import { handle } from "@/lib/server/http";
export async function POST(request: Request) { return handle(request, () => reportContent(request)); }
