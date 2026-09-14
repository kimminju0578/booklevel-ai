import 'server-only';
import { z } from 'zod';
import { adminDb, requireUser, sessionDb } from './db';
import { body,event,rateLimit } from './http';
import { checked,ApiError } from './errors';
import { uuid } from '@/lib/domain/schemas';

export async function authAction(request:Request,action:string) {
 const db=await sessionDb();await rateLimit(request,'auth',undefined,5,60);
 if(action==='logout'){checked(await db.auth.signOut());return {ok:true}}
 const v=await body(request,z.object({email:z.email().max(254),password:z.string().min(8).max(128),displayName:z.string().trim().min(1).max(30).optional()}).strict());
 if(action==='signup'){
  const {data,error}=await db.auth.signUp({email:v.email,password:v.password,options:{data:{display_name:v.displayName||'독자'},emailRedirectTo:`${process.env.APP_URL||new URL(request.url).origin}/auth/callback`}});
  if(error)throw new ApiError(400,'SIGNUP_FAILED','가입 정보를 확인해주세요. 이미 가입했다면 로그인해주세요.');
  return {needsConfirmation:!data.session};
 }
 const {error}=await db.auth.signInWithPassword({email:v.email,password:v.password});
 if(error)throw new ApiError(401,'LOGIN_FAILED','이메일 또는 비밀번호를 확인해주세요.');return {ok:true};
}
export async function profile(request:Request) {
 const {db,user}=await requireUser();
 if(request.method==='PATCH'){const v=await body(request,z.object({displayName:z.string().trim().min(1).max(30)}).strict());checked(await adminDb().from('profiles').update({display_name:v.displayName,updated_at:new Date().toISOString()}).eq('id',user.id));}
 const data=checked(await db.from('profiles').select('id,display_name,avatar_url,created_at').eq('id',user.id).single());
 const levels=checked(await db.from('user_category_levels').select('*,categories(name,slug)').eq('user_id',user.id));
 const library=checked(await db.from('user_books').select('status').eq('user_id',user.id));
 const own=checked(await adminDb().from('profiles').select('role').eq('id',user.id).single());
 return {profile:data,levels,counts:{reading:library?.filter(b=>b.status==='reading').length||0,completed:library?.filter(b=>b.status==='completed').length||0,want_to_read:library?.filter(b=>b.status==='want_to_read').length||0},isAdmin:own?.role==='admin'};
}
export async function interests(request:Request) {
 const {user}=await requireUser();const input=await body(request,z.object({categoryIds:z.array(uuid).min(1).max(3)}).strict());
 checked(await adminDb().rpc('set_interests',{p_user:user.id,p_categories:input.categoryIds}));await event(user.id,'onboarding_completed',{categoryIds:input.categoryIds});return {ok:true};
}
