import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { bookRow, reasonSchema, uuid } from '@/lib/domain/schemas';
import { interestWeight, knowledgeGap, recommendationScore } from '@/lib/domain/scoring';
import { structuredAI } from '@/lib/ai/client';
import { recommendationPrompt } from '@/lib/ai/prompts';
import { adminDb, requireUser } from './db';
import { body,event,rateLimit } from './http';
import { ApiError,checked } from './errors';

export async function getRecommendations(){const {db,user}=await requireUser();return {recommendations:checked(await db.from('recommendations').select('*,books(*)').eq('user_id',user.id).order('rank').limit(15))};}
export async function generateRecommendations(request:Request) {
 const {db,user}=await requireUser();await rateLimit(request,'recommendation',user.id,5,3600);
 const {categoryId}=await body(request,z.object({categoryId:uuid}).strict());
 const level=checked(await db.from('user_category_levels').select('*').eq('user_id',user.id).eq('category_id',categoryId).maybeSingle());
 if(!level)throw new ApiError(409,'ASSESSMENT_REQUIRED','먼저 해당 분야 진단을 완료해주세요.');
 const links=checked(await db.from('book_categories').select('book_id').eq('category_id',categoryId).limit(1000));
 if(!links?.length)return {recommendations:[],warning:'검증된 분야별 도서를 준비하고 있습니다.'};
 const candidates=bookRow.array().parse(checked(await db.from('books').select('*').in('id',links.map(b=>b.book_id)).eq('is_active',true).eq('metadata_quality','verified').gte('difficulty_level',Math.max(1,Number(level.level)-1.5)).lte('difficulty_level',Math.min(5,Number(level.level)+1.5)).limit(1000)));
 const history=checked(await db.from('user_books').select('book_id,status').eq('user_id',user.id));
 const interests=checked(await db.from('user_interests').select('category_id,priority').eq('user_id',user.id));
 const topics=checked(await db.from('book_topics').select('book_id,topic,importance').in('book_id',candidates.map(b=>b.id)).eq('verified',true));
 const accuracy=z.record(z.string(),z.number()).parse(level.topic_scores);
 const ranking=candidates.map(book=>{const status=history?.find(h=>h.book_id===book.id)?.status;const priority=interests?.find(i=>i.category_id===categoryId)?.priority;const bookTopics=topics?.filter(t=>t.book_id===book.id)||[];return {book,bookTopics,score:recommendationScore({level:Number(level.level),difficulty:book.difficulty_level!,interest:interestWeight(priority),gap:knowledgeGap(bookTopics,accuracy),novelty:status==='completed'?0:status==='reading'?.2:1})}}).sort((a,b)=>b.score-a.score||a.book.id.localeCompare(b.book.id)).slice(0,5);
 const rows=[];
 for(const {book,bookTopics,score} of ranking){
  const input={user_level:level.level,weak_topics:Object.entries(accuracy).filter(([,v])=>v<.5).map(([k])=>k),book:{title:book.title,difficulty:book.difficulty_level,topics:bookTopics}};
  const key=createHash('sha256').update(JSON.stringify([user.id,book.id,level.level,input])).digest('hex');
  const cached=checked(await adminDb().from('ai_cache').select('value').eq('key',key).gt('expires_at',new Date().toISOString()).maybeSingle());
  let value=cached?reasonSchema.parse(cached.value):null;let source=cached?'cache':'fallback';
  if(!value){const generated=await structuredAI('recommendation',user.id,recommendationPrompt,input,reasonSchema);value=generated?.value||{reason:`현재 분야 수준과 도서 난이도를 기준으로 선정한 책입니다. ${bookTopics.length?'확인된 주제를 중심으로 개념을 연결하며 읽어보세요.':'관심 있는 개념과 질문을 기록하며 읽어보세요.'}`,next_learning_focus:bookTopics.slice(0,3).map(t=>t.topic)};source=generated?'ai':'fallback';checked(await adminDb().from('ai_cache').upsert({key,user_id:user.id,value,expires_at:new Date(Date.now()+(generated?7*86400000:300000)).toISOString()}));}
  rows.push({user_id:user.id,book_id:book.id,category_id:categoryId,level:level.level,score,ai_reason:value.reason,reading_focus:value.next_learning_focus,source,rank:rows.length+1,generated_at:new Date().toISOString()});
 }
 if(rows.length){checked(await adminDb().from('recommendations').delete().eq('user_id',user.id).eq('category_id',categoryId));checked(await adminDb().from('recommendations').insert(rows));}
 await event(user.id,'recommendation_generated',{categoryId,count:rows.length});return getRecommendations();
}
