import { getTasteProfile } from "@/lib/server/taste";
import { handle } from "@/lib/server/http";
export async function GET() { return handle(new Request("http://localhost/api/taste/profile"), getTasteProfile); }
