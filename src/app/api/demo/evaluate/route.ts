import { z } from "zod";
import { AIServiceError, structuredAI } from "@/lib/ai/client";
import { essayEvaluationPrompt } from "@/lib/ai/prompts";
import { evaluationOutput, parseEvaluation } from "@/lib/domain/schemas";
import { ApiError } from "@/lib/server/errors";

const inputSchema = z.object({
  question: z.string().trim().min(10).max(2000),
  content: z.string().trim().min(20, "답안은 20자 이상 작성해주세요.").max(10000),
}).strict();

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
      throw new ApiError(503, "AI_NOT_CONFIGURED", "Vercel에 OpenAI 환경변수를 먼저 설정해주세요.");
    }
    const result = await structuredAI(
      "essay_evaluation",
      "demo-user",
      essayEvaluationPrompt,
      { question: input.question, essay: input.content },
      evaluationOutput,
      parseEvaluation,
      { throwOnError: true },
    );
    if (!result) throw new ApiError(502, "AI_UNAVAILABLE", "AI 평가를 완료하지 못했습니다. 잠시 후 다시 시도해주세요.");
    return Response.json({ evaluation: result.value });
  } catch (error) {
    if (error instanceof ApiError) return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    if (error instanceof AIServiceError) {
      const messages: Record<AIServiceError["code"], string> = {
        AI_RATE_LIMITED: "AI 요청이 많습니다. 잠시 후 다시 시도해주세요.",
        AI_QUOTA: "OpenAI API 결제 정보 또는 사용 한도를 확인해주세요.",
        AI_TIMEOUT: "AI 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
        AI_SERVER_ERROR: "OpenAI 서버가 잠시 불안정합니다. 잠시 후 다시 시도해주세요.",
        AI_CONFIGURATION: "OpenAI 모델 설정을 확인해주세요.",
        AI_OUTPUT_INVALID: "AI 응답 형식을 확인하지 못했습니다. 다시 시도해주세요.",
        AI_UNAVAILABLE: "AI 피드백을 연결하지 못했습니다. 잠시 후 다시 시도해주세요.",
      };
      return Response.json({ error: { code: error.code, message: messages[error.code] } }, { status: error.status });
    }
    if (error instanceof z.ZodError) return Response.json({ error: { code: "VALIDATION_ERROR", message: "질문과 답안을 확인해주세요." } }, { status: 400 });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "평가 중 문제가 발생했습니다. 다시 시도해주세요." } }, { status: 500 });
  }
}
