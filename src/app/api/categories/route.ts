import { identity } from "@/lib/server/db";
import { checked } from "@/lib/server/errors";
import { handle } from "@/lib/server/http";
export async function GET(request: Request) { return handle(request, async () => { const {db}=await identity(false); return {categories:checked(await db.from('categories').select('id,slug,name').order('name'))}; }); }
