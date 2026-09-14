import 'server-only';
import { z } from 'zod';
import { contentSchema,pageSchema,reviewInput,uuid } from '@/lib/domain/schemas';
import { adminDb,identity,requireUser } from './db';
import { ApiError,checked } from './errors';
import { body,event,rateLimit } from './http';
import { structuredAI } from '@/lib/ai/client';
import { discussionPrompt } from '@/lib/ai/prompts';
import { discussionSchema } from '@/lib/domain/schemas';
import { awardVerifiedActivity } from './gamification';
import { isChallenger } from '@/lib/gamification/scoring';

const authorFields='profiles(id,display_name,avatar_url)';
async function withRankMarks<T>(rows: T[], getUserId:(row:T)=>string|null) {
 const ids=[...new Set(rows.map(getUserId).filter((id):id is string=>Boolean(id)))];
 if(!ids.length)return rows.map(row=>({...row,rankMark:null}));
 const database=adminDb();
 const [ratings,season]=await Promise.all([
  database.from('user_ratings').select('user_id,tier_key,current_season_rank').in('user_id',ids),
  database.from('seasons').select('status').eq('status','active').maybeSingle(),
 ]);
 const ratingRows=checked(ratings)||[];
 const byUser=new Map(ratingRows.map(row=>[row.user_id,row]));
 return rows.map(row=>{const rating=byUser.get(getUserId(row));return {...row,rankMark:rating?{tier:rating.tier_key,challengerRank:isChallenger(rating.current_season_rank,String(season?.status||''))?rating.current_season_rank:null}:null};});
}
export async function reviews(request:Request,bookId:string) {
 uuid.parse(bookId);const {db,user}=await identity(request.method!=='GET');
 if(request.method==='POST'){
  await rateLimit(request,'community-write',user!.id,15);
  const v=await body(request,reviewInput);
  const book=checked(await db.from('books').select('id').eq('id',bookId).maybeSingle());if(!book)throw new ApiError(404,'NOT_FOUND','책을 찾을 수 없습니다.');
  const review=checked(await adminDb().from('reviews').insert({user_id:user!.id,book_id:bookId,rating:v.rating,short_review:v.shortReview,content:v.content,perceived_difficulty:v.perceivedDifficulty,recommended_for:v.recommendedFor,contains_spoiler:v.containsSpoiler}).select('id').single());
  if(!review)throw new ApiError(500,'DATABASE_ERROR','리뷰를 저장하지 못했습니다.');
  await event(user!.id,'review_created',{bookId});
  await awardVerifiedActivity(user!.id,{eventType:'review_created',sourceType:'review',sourceId:review.id,idempotencyKey:`review:${review.id}`,qualityPassed:v.content.trim().length>=80});
  return review;
 }
 const url=new URL(request.url),page=pageSchema.parse(url.searchParams.get('page')||1),sort=z.enum(['newest','popular','high','low']).parse(url.searchParams.get('sort')||'newest');
 let query=db.from('reviews').select(`*,${authorFields}`,{count:'exact'}).eq('book_id',bookId);
 query=sort==='high'||sort==='low'?query.order('rating',{ascending:sort==='low'}):query.order('created_at',{ascending:false});
 const result=await query.range((page-1)*20,page*20-1);const data=checked(result)||[];
 const likes=checked(await adminDb().from('likes').select('target_id').eq('target_type','review').in('target_id',data.map(r=>r.id)));
 const rows=data.map(r=>({...r,likeCount:likes?.filter(l=>l.target_id===r.id).length||0}));
 if(sort==='popular')rows.sort((a,b)=>b.likeCount-a.likeCount);
 return {reviews:await withRankMarks(rows,row=>row.user_id),total:result.count||0,page};
}
export async function reviewAction(request:Request,id:string,action:string) {
 uuid.parse(id);const {db,user}=await identity(request.method==='GET'&&action==='comments'?false:true);if(user)await rateLimit(request,'community-write',user.id,30);
 const review=checked(await db.from('reviews').select('id,user_id').eq('id',id).maybeSingle());if(!review)throw new ApiError(404,'NOT_FOUND','리뷰를 찾을 수 없습니다.');
 if(action==='like'){
  if(!user)throw new ApiError(401,'AUTH_REQUIRED','로그인이 필요합니다.');
  const {liked}=await body(request,z.object({liked:z.boolean()}).strict());
  if(liked)checked(await adminDb().from('likes').upsert({user_id:user.id,target_type:'review',target_id:id}));else checked(await adminDb().from('likes').delete().eq('user_id',user.id).eq('target_type','review').eq('target_id',id));
  await event(user.id,'review_liked',{reviewId:id});
  const likeCount=(checked(await adminDb().from('likes').select('user_id').eq('target_type','review').eq('target_id',id)))?.length||0;
  if(likeCount===10)await awardVerifiedActivity(review.user_id,{eventType:'review_helpful_milestone',sourceType:'review',sourceId:id,idempotencyKey:`review-helpful:${id}`,qualityPassed:true});
  return {liked};
 }
 if(action==='comments'){
  if(request.method==='GET')return {comments:await withRankMarks(checked(await db.from('review_comments').select(`*,${authorFields}`).eq('review_id',id).order('created_at').limit(100))||[],row=>row.user_id)};
  if(!user)throw new ApiError(401,'AUTH_REQUIRED','로그인이 필요합니다.');
  const {content}=await body(request,z.object({content:contentSchema}).strict());return checked(await adminDb().from('review_comments').insert({review_id:id,user_id:user.id,content}).select('id').single());
 }
 if(!user)throw new ApiError(401,'AUTH_REQUIRED','로그인이 필요합니다.');
 if(review.user_id!==user.id)throw new ApiError(403,'FORBIDDEN','본인 리뷰만 변경할 수 있습니다.');
 if(request.method==='DELETE'){checked(await adminDb().from('reviews').delete().eq('id',id).eq('user_id',user.id));return {ok:true}}
 const v=await body(request,reviewInput);checked(await adminDb().from('reviews').update({rating:v.rating,short_review:v.shortReview,content:v.content,perceived_difficulty:v.perceivedDifficulty,recommended_for:v.recommendedFor,contains_spoiler:v.containsSpoiler,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',user.id));return {ok:true};
}
export async function discussions(request:Request,bookId:string){
 uuid.parse(bookId);const {db,user}=await identity(request.method!=='GET');
 if(request.method==='GET'){const page=pageSchema.parse(new URL(request.url).searchParams.get('page')||1);return {discussions:await withRankMarks(checked(await db.from('discussions').select(`*,${authorFields}`).eq('book_id',bookId).order('created_at',{ascending:false}).range((page-1)*20,page*20-1))||[],row=>row.created_by)}}
 await rateLimit(request,'discussion-create',user!.id,10);const v=await body(request,z.object({title:z.string().trim().min(1).max(160),question:contentSchema}).strict());
 if(!checked(await db.from('books').select('id').eq('id',bookId).maybeSingle()))throw new ApiError(404,'NOT_FOUND','책을 찾을 수 없습니다.');
 const result=checked(await adminDb().from('discussions').insert({book_id:bookId,title:v.title,question:v.question,source:'user',created_by:user!.id}).select('id').single());if(!result)throw new ApiError(500,'DATABASE_ERROR','토론을 저장하지 못했습니다.');await event(user!.id,'discussion_created',{bookId});await awardVerifiedActivity(user!.id,{eventType:'discussion_joined',sourceType:'discussion',sourceId:result.id,idempotencyKey:`discussion:${result.id}`,qualityPassed:v.question.trim().length>=40});return result;
}
export async function generateDiscussion(request:Request,bookId:string){
 uuid.parse(bookId);const {db,user}=await requireUser();await rateLimit(request,'discussion-generate',user.id,5,3600);
 const book=checked(await db.from('books').select('id,title,authors,publisher,difficulty_level').eq('id',bookId).maybeSingle());if(!book)throw new ApiError(404,'NOT_FOUND','책을 찾을 수 없습니다.');
 const topics=checked(await db.from('book_topics').select('topic,importance').eq('book_id',bookId).eq('verified',true).limit(20));
 const ai=await structuredAI('discussion',user.id,discussionPrompt,{book,topics},discussionSchema);
 const value=ai?.value||{title:`『${book.title}』을 읽고 달라진 관점`,question:`『${book.title}』을 읽기 전과 후에 달라진 생각이 있다면 무엇이며, 그 변화에 동의하지 않을 독자에게 어떤 근거로 설명할 수 있을까요?`,suggested_angles:['읽기 전의 관점','생각이 달라진 이유','가능한 반론']};
 const result=checked(await adminDb().from('discussions').insert({book_id:bookId,title:value.title,question:value.question,source:ai?'ai':'fallback',created_by:user.id}).select('id,title,question,source').single());
 await event(user.id,'discussion_generated',{bookId,source:ai?'ai':'fallback'});return {discussion:result,suggestedAngles:value.suggested_angles,warning:ai?null:'AI 연결 없이 안전한 기본 질문을 만들었습니다.'};
}
export async function discussionDetail(id:string){uuid.parse(id);const {db}=await identity(false);const discussion=checked(await db.from('discussions').select(`*,${authorFields}`).eq('id',id).maybeSingle());if(!discussion)throw new ApiError(404,'NOT_FOUND','토론을 찾을 수 없습니다.');const posts=checked(await db.from('discussion_posts').select(`*,${authorFields}`).eq('discussion_id',id).order('created_at').limit(100))||[];return {discussion:(await withRankMarks([discussion],row=>row.created_by))[0],posts:await withRankMarks(posts,row=>row.user_id)};}
export async function postOpinion(request:Request,id:string){
 uuid.parse(id);const {db,user}=await requireUser();await rateLimit(request,'community-write',user.id,20);
 const v=await body(request,z.object({stance:z.enum(['agree','disagree','neutral']),content:contentSchema,parentId:uuid.nullable().default(null)}).strict());
 if(!checked(await db.from('discussions').select('id').eq('id',id).maybeSingle()))throw new ApiError(404,'NOT_FOUND','토론을 찾을 수 없습니다.');
 if(v.parentId){const parent=checked(await db.from('discussion_posts').select('discussion_id,parent_id').eq('id',v.parentId).maybeSingle());if(!parent||parent.discussion_id!==id||parent.parent_id)throw new ApiError(400,'INVALID_PARENT','같은 토론의 원글에만 답글을 작성할 수 있습니다.');}
 const result=checked(await adminDb().from('discussion_posts').insert({discussion_id:id,user_id:user.id,stance:v.stance,content:v.content,parent_id:v.parentId}).select('id').single());if(!result)throw new ApiError(500,'DATABASE_ERROR','토론 답글을 저장하지 못했습니다.');await event(user.id,v.parentId?'discussion_reply':'discussion_joined',{discussionId:id});await awardVerifiedActivity(user.id,{eventType:v.parentId?'discussion_reply':'discussion_joined',sourceType:'discussion_post',sourceId:result.id,idempotencyKey:`discussion-post:${result.id}`,qualityPassed:v.content.trim().length>=40});return result;
}
export async function communityHome(){const {db,user}=await identity(false);const reviews=checked(await db.from('reviews').select(`*,${authorFields},books(title)`).order('created_at',{ascending:false}).limit(20))||[];const discussions=checked(await db.from('discussions').select(`*,${authorFields},books(title)`).order('created_at',{ascending:false}).limit(20))||[];return {reviews:await withRankMarks(reviews,row=>row.user_id),discussions:await withRankMarks(discussions,row=>row.created_by),signedIn:!!user};}

export async function reportContent(request:Request){
 const {user}=await requireUser();await rateLimit(request,'report',user.id,10,3600);
 const input=await body(request,z.object({targetType:z.enum(['review','review_comment','discussion','discussion_post','essay']),targetId:uuid,reason:z.enum(['spam','abuse','spoiler','misinformation','privacy','other']),details:z.string().trim().max(2000).default('')}).strict());
 const tableByType={review:'reviews',review_comment:'review_comments',discussion:'discussions',discussion_post:'discussion_posts',essay:'essays'} as const;
 const target=checked(await adminDb().from(tableByType[input.targetType]).select('id').eq('id',input.targetId).maybeSingle());
 if(!target)throw new ApiError(404,'NOT_FOUND','신고 대상을 찾을 수 없습니다.');
 const report=checked(await adminDb().from('reports').insert({reporter_id:user.id,target_type:input.targetType,target_id:input.targetId,reason:input.reason,details:input.details}).select('id,status').single());
 await event(user.id,'content_reported',{targetType:input.targetType});return report;
}

export async function toggleLike(request:Request,targetType:'discussion_post'|'essay',targetId:string){
 uuid.parse(targetId);const {user}=await requireUser();await rateLimit(request,'community-write',user.id,30);
 const {liked}=await body(request,z.object({liked:z.boolean()}).strict());
 if(targetType==='essay'){
  const target=checked(await adminDb().from('essays').select('id,is_public,hidden').eq('id',targetId).maybeSingle());
  if(!target||target.hidden||!target.is_public)throw new ApiError(404,'NOT_FOUND','대상을 찾을 수 없습니다.');
 } else {
  const target=checked(await adminDb().from('discussion_posts').select('id,hidden').eq('id',targetId).maybeSingle());
  if(!target||target.hidden)throw new ApiError(404,'NOT_FOUND','대상을 찾을 수 없습니다.');
 }
 if(liked)checked(await adminDb().from('likes').upsert({user_id:user.id,target_type:targetType,target_id:targetId}));else checked(await adminDb().from('likes').delete().eq('user_id',user.id).eq('target_type',targetType).eq('target_id',targetId));
 return {liked};
}
