import { essayVisibility } from "@/lib/server/essay";
import { handle } from "@/lib/server/http";
export async function PUT(request: Request, context: { params: Promise<{ essayId: string }> }) { return handle(request, async () => essayVisibility(request, (await context.params).essayId)); }
