import 'server-only';
import OpenAI, { APIConnectionError, APIConnectionTimeoutError, APIError } from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { adminDb } from '@/lib/server/db';
import { configured } from '@/lib/server/env';

type Feature='recommendation'|'discussion'|'essay_question'|'essay_evaluation';
type AIErrorCode='AI_RATE_LIMITED'|'AI_QUOTA'|'AI_TIMEOUT'|'AI_SERVER_ERROR'|'AI_CONFIGURATION'|'AI_OUTPUT_INVALID'|'AI_UNAVAILABLE';
export class AIServiceError extends Error {
 constructor(public status:number,public code:AIErrorCode) {super(code)}
}
function classify(error:unknown):AIServiceError {
 if(error instanceof APIConnectionTimeoutError)return new AIServiceError(504,'AI_TIMEOUT');
 if(error instanceof APIConnectionError)return new AIServiceError(503,'AI_UNAVAILABLE');
 if(error instanceof z.ZodError)return new AIServiceError(502,'AI_OUTPUT_INVALID');
 if(error instanceof APIError){
  if(error.status===429&&error.code==='insufficient_quota')return new AIServiceError(429,'AI_QUOTA');
  if(error.status===429)return new AIServiceError(429,'AI_RATE_LIMITED');
  if(typeof error.status==='number'&&error.status>=500)return new AIServiceError(502,'AI_SERVER_ERROR');
  if(error.status===400||error.status===401||error.status===403||error.status===404)return new AIServiceError(502,'AI_CONFIGURATION');
 }
 return new AIServiceError(502,'AI_UNAVAILABLE');
}
export async function structuredAI<T>(feature:Feature,userId:string,system:string,input:unknown,schema:z.ZodType<T>,validate:(value:T)=>T=(v)=>v,options:{throwOnError?:boolean}={}):Promise<{value:T;model:string}|null> {
 const model=process.env.OPENAI_MODEL;
 if(!process.env.OPENAI_API_KEY||!model)return null;
 const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,maxRetries:0,timeout:20000});
 let lastError:AIServiceError|undefined;
 for(let attempt=0;attempt<2;attempt++){
  const started=Date.now();let success=false,inputTokens=0,outputTokens=0;
  try{
   const response=await client.responses.parse({model,store:false,max_output_tokens:feature==='essay_evaluation'?4000:1000,input:[{role:'system',content:system},{role:'user',content:JSON.stringify(input)}],text:{format:zodTextFormat(schema,feature)}});
   inputTokens=response.usage?.input_tokens||0;outputTokens=response.usage?.output_tokens||0;
   if(response.status!=='completed'||!response.output_parsed)throw new Error('INVALID_AI_RESPONSE');
   const value=validate(schema.parse(response.output_parsed));success=true;return {value,model};
  }catch(error){lastError=classify(error);}
  finally{if(configured()){const {error}=await adminDb().from('ai_usage_logs').insert({user_id:userId,feature,model,input_tokens:inputTokens,output_tokens:outputTokens,latency_ms:Date.now()-started,success});if(error)console.warn(JSON.stringify({event:'ai_usage_log_failed',code:error.code}));}}
 }
 if(options.throwOnError&&lastError)throw lastError;
 return null;
}
