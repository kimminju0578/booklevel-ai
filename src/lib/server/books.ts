import 'server-only';
import { z } from 'zod';
import { bookRow,uuid } from '@/lib/domain/schemas';
import { adminDb,identity,requireUser } from './db';
import { ApiError,checked } from './errors';
import { body,event } from './http';
import { awardVerifiedActivity } from './gamification';

export async function bookDetail(id:string) {
 uuid.parse(id);const {db,user}=await identity(false);
 const raw=checked(await db.from('books').select('*').eq('id',id).maybeSingle());if(!raw)throw new ApiError(404,'NOT_FOUND','책을 찾을 수 없습니다.');
 const book=bookRow.parse(raw);const ratings=checked(await db.from('reviews').select('rating').eq('book_id',id));
 const state=user?checked(await db.from('user_books').select('*').eq('user_id',user.id).eq('book_id',id).maybeSingle()):null;
 const recommendation=user?checked(await db.from('recommendations').select('score,ai_reason,reading_focus,source').eq('user_id',user.id).eq('book_id',id).order('generated_at',{ascending:false}).limit(1).maybeSingle()):null;
 const distribution=[1,2,3,4,5].map(rating=>({rating,count:ratings?.filter(r=>r.rating===rating).length||0}));
 const count=ratings?.length||0;return {book,currentUserState:state,recommendation,reviewSummary:{count,average:count?ratings!.reduce((s,r)=>s+r.rating,0)/count:null,distribution}};
}
export async function readingStatus(request:Request,id:string) {
 uuid.parse(id);const {user,db}=await requireUser();const {status}=await body(request,z.object({status:z.enum(['want_to_read','reading','completed','paused'])}).strict());
 const book=checked(await db.from('books').select('id').eq('id',id).maybeSingle());if(!book)throw new ApiError(404,'NOT_FOUND','책을 찾을 수 없습니다.');
 const previous=checked(await db.from('user_books').select('started_at,completed_at,status').eq('user_id',user.id).eq('book_id',id).maybeSingle());
 checked(await adminDb().from('user_books').upsert({user_id:user.id,book_id:id,status,started_at:previous?.started_at||(status==='reading'?new Date().toISOString():null),completed_at:status==='completed'?(previous?.completed_at||new Date().toISOString()):null,updated_at:new Date().toISOString()}));
 if(status!==previous?.status){
  const eventType=status==='reading'?'book_started':status==='completed'?'book_completed':'book_saved';
  await event(user.id,eventType,{bookId:id});
  await awardVerifiedActivity(user.id,{eventType,sourceType:'book',sourceId:id,idempotencyKey:`${eventType}:${id}`,qualityPassed:true});
 }
 return {ok:true};
}
export async function library(){const {db,user}=await requireUser();return {books:checked(await db.from('user_books').select('*,books(*)').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(100))};}
