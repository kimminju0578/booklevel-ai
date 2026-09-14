import { communityHome } from "@/lib/server/community";
import { handle } from "@/lib/server/http";
export async function GET(request: Request) { return handle(request, communityHome); }
