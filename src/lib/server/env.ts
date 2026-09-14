import "server-only";
import { z } from "zod";

export function configured() { return process.env.SUPABASE_ENABLED === "true" && !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY; }
export function serverEnv() {
  return z.object({NEXT_PUBLIC_SUPABASE_URL:z.url(),NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:z.string().min(1),SUPABASE_SERVICE_ROLE_KEY:z.string().min(1)}).parse(process.env);
}
