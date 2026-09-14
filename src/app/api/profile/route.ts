import { profile } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";
export async function GET(request: Request) { return handle(request, () => profile(request)); }
export async function PATCH(request: Request) { return handle(request, () => profile(request)); }
