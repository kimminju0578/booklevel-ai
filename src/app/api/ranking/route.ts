import { ranking } from "@/lib/server/gamification";
import { handle } from "@/lib/server/http";
export async function GET(request: Request) { return handle(request, () => ranking(request)); }
