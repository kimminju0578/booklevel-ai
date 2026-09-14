import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configured, serverEnv } from "./env";
import { ApiError } from "./errors";

export function adminDb() {
  if(!configured()) throw new ApiError(503,'SERVICE_NOT_CONFIGURED','서비스 연결을 준비하고 있습니다. 잠시 후 다시 확인해주세요.');
  const env=serverEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function sessionDb() {
  if(!configured()) throw new ApiError(503,'SERVICE_NOT_CONFIGURED','서비스 연결을 준비하고 있습니다.');
  const env=serverEnv(); const jar=await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return jar.getAll();
        },
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            // Server Components cannot write; Proxy refreshes the session.
          }
        },
      },
    },
  );
}
export async function identity(required=true) {
  const db=await sessionDb(); const {data,error}=await db.auth.getUser();
  if((error||!data.user)&&required) throw new ApiError(401,'AUTH_REQUIRED','로그인이 필요합니다.');
  return {db,user:data.user};
}
export async function requireUser() { const ctx=await identity(); return {db:ctx.db,user:ctx.user!}; }
export async function requireAdmin() { const ctx=await requireUser(); const {data,error}=await adminDb().from('profiles').select('role').eq('id',ctx.user.id).single(); if(error||data?.role!=='admin') throw new ApiError(403,'FORBIDDEN','관리자 권한이 필요합니다.'); return ctx; }
