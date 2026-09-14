import { equipProfileBadges } from "@/lib/server/gamification";
import { handle } from "@/lib/server/http";
export async function POST(request: Request) { return handle(request, () => equipProfileBadges(request)); }
