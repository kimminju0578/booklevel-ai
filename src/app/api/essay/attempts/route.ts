import { startEssay } from "@/lib/server/essay";
import { handle } from "@/lib/server/http";
export async function POST(request: Request) { return handle(request, () => startEssay(request)); }
