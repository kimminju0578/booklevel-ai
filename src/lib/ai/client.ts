import 'server-only';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { adminDb } from '@/lib/server/db';

type Feature='recommendation'|'discussion'|'essay_question'|'essay_evaluation';
export async function structuredAI<T>(feature:Feature,userId:string,system:string,input:unknown,schema:z.ZodType<T>,validate:(value:T)=>T=(v)=>v):Promise<{value:T;model:string}|null> {
 const model=feature==='recommendation'?process.env.OPENAI_MODEL_RECOMMENDATION:feature==='discussion'?process.env.OPENAI_MODEL_DISCUSSION:process.env.OPENAI_MODEL_ESSAY;
 if(!process.env.OPENAI_API_KEY||!model)return null;
 const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,maxRetries:0,timeout:20000});
 for(let attempt=0;attempt<2;attempt++){
  const started=Date.now();let success=false,inputTokens=0,outputTokens=0;
  try{
   const response=await client.responses.parse({model,store:false,max_output_tokens:feature==='essay_evaluation'?2400:1000,input:[{role:'system',content:system},{role:'user',content:JSON.stringify(input)}],text:{format:zodTextFormat(schema,feature)}});
   inputTokens=response.usage?.input_tokens||0;outputTokens=response.usage?.output_tokens||0;
   if(response.status!=='completed'||!response.output_parsed)throw new Error('INVALID_AI_RESPONSE');
   const value=validate(schema.parse(response.output_parsed));success=true;return {value,model};
  }catch{/* One bounded retry; the caller provides a domain-specific fallback. */}
  finally{const {error}=await adminDb().from('ai_usage_logs').insert({user_id:userId,feature,model,input_tokens:inputTokens,output_tokens:outputTokens,latency_ms:Date.now()-started,success});if(error)console.warn(JSON.stringify({event:'ai_usage_log_failed',code:error.code}));}
 }
 return null;
}
