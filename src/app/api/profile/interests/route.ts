import { interests } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";
export async function PUT(request: Request) { return handle(request, () => interests(request)); }
