import 'server-only';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { adminDb, requireUser } from './db';
import { body, rateLimit } from './http';
import { checked, ApiError } from './errors';
import { uuid } from '@/lib/domain/schemas';
import { awardVerifiedActivity } from './gamification';

const snapshotQuestion=z.object({id:uuid,question:z.string(),level:z.number(),topic:z.string(),options:z.array(z.object({id:z.string(),text:z.string()})),correct_option:z.enum(['A','B','C','D']),explanation:z.string()});
function shuffled<T>(items:T[]) {
 const result=[...items];
 for(let index=result.length-1;index>0;index--){const swap=randomInt(index+1);[result[index],result[swap]]=[result[swap],result[index]];}
 return result;
}
export async function startAssessment(request:Request) {
 const {user}=await requireUser();await rateLimit(request,'assessment-start',user.id,5,3600);
 const {categoryId}=await body(request,z.object({categoryId:uuid}).strict());
 const raw=checked(await adminDb().rpc('start_assessment',{p_user:user.id,p_category:categoryId}));
 const data=z.object({id:uuid,question_snapshot:z.array(snapshotQuestion)}).parse(raw);
 return {attemptId:data.id,questions:data.question_snapshot.map((question)=>({id:question.id,question:question.question,level:question.level,topic:question.topic,options:shuffled(question.options)}))};
}
export async function submitAssessment(request:Request) {
 const {user}=await requireUser();await rateLimit(request,'assessment-submit',user.id,10,3600);
 const input=await body(request,z.object({attemptId:uuid,answers:z.array(z.object({questionId:uuid,selectedOption:z.enum(['A','B','C','D'])}).strict()).length(10)}).strict());
 const raw=checked(await adminDb().rpc('submit_assessment',{p_user:user.id,p_attempt:input.attemptId,p_answers:input.answers}));
 const result=z.object({id:uuid,category_id:uuid,score:z.number(),calculated_level:z.number(),topic_scores:z.record(z.string(),z.number()),completed_at:z.string()}).parse(raw);
 await awardVerifiedActivity(user.id,{eventType:'assessment_completed',sourceType:'assessment',sourceId:input.attemptId,idempotencyKey:`assessment:${input.attemptId}`,qualityPassed:true});
 return result;
}
export async function assessmentResult(id:string) {
 const {user}=await requireUser();uuid.parse(id);
 const data=checked(await adminDb().from('assessment_attempts').select('id,user_id,category_id,score,calculated_level,topic_scores,completed_at,question_snapshot').eq('id',id).eq('user_id',user.id).maybeSingle());
 if(!data)throw new ApiError(404,'NOT_FOUND','진단을 찾을 수 없습니다.');
 if(!data.completed_at)throw new ApiError(409,'ASSESSMENT_INCOMPLETE','완료된 진단만 확인할 수 있습니다.');
 const snapshot=z.array(snapshotQuestion).parse(data.question_snapshot);
 const answers=checked(await adminDb().from('assessment_answers').select('question_id,selected_option,is_correct').eq('attempt_id',id)) ?? [];
 const answerByQuestion=new Map(answers.map((answer)=>[answer.question_id,answer]));
 return {id:data.id,category_id:data.category_id,score:data.score,calculated_level:data.calculated_level,topic_scores:data.topic_scores,completed_at:data.completed_at,questions:snapshot.map((question)=>({id:question.id,question:question.question,topic:question.topic,options:question.options,correctOption:question.correct_option,explanation:question.explanation,selectedOption:answerByQuestion.get(question.id)?.selected_option ?? null,isCorrect:answerByQuestion.get(question.id)?.is_correct ?? false}))};
}
