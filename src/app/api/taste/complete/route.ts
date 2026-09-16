import { completeTasteTest } from "@/lib/server/taste";
import { handle } from "@/lib/server/http";
export async function POST(request: Request) { return handle(request, () => completeTasteTest(request)); }
