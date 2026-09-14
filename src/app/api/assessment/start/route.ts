import { startAssessment } from "@/lib/server/assessment";
import { handle } from "@/lib/server/http";
export async function POST(request: Request) { return handle(request, () => startAssessment(request)); }
