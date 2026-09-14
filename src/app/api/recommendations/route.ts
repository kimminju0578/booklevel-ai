import { generateRecommendations, getRecommendations } from "@/lib/server/recommendations";
import { handle } from "@/lib/server/http";
export async function GET(request: Request) { return handle(request, getRecommendations); }
export async function POST(request: Request) { return handle(request, () => generateRecommendations(request)); }
