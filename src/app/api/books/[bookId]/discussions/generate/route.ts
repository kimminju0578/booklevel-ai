import { generateDiscussion } from "@/lib/server/community";
import { handle } from "@/lib/server/http";
export async function POST(request:Request,context:{params:Promise<{bookId:string}>}){return handle(request,async()=>generateDiscussion(request,(await context.params).bookId))}
