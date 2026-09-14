import { authAction } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { handle } from "@/lib/server/http";

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  return handle(request, async () => {
    const { action } = await context.params;
    if (!['login', 'signup', 'logout'].includes(action)) throw new ApiError(404, 'NOT_FOUND', '요청을 찾을 수 없습니다.');
    return authAction(request, action);
  });
}
