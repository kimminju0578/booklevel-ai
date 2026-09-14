import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { z } from "zod";
import { adminDb } from "./db";
import { ApiError, checked } from "./errors";

export async function body<T>(request:Request,schema:z.ZodType<T>):Promise<T> {
  if(!request.headers.get('content-type')?.includes('application/json')) throw new ApiError(415,'JSON_REQUIRED','JSON 요청이 필요합니다.');
  const raw=await request.text();
  if(Buffer.byteLength(raw)>64000) throw new ApiError(413,'TOO_LARGE','입력 내용이 너무 깁니다.');
  try {return schema.parse(JSON.parse(raw))}catch(e){if(e instanceof z.ZodError)throw e;throw new ApiError(400,'INVALID_JSON','요청 형식을 확인해주세요.')}
}
export async function rateLimit(request:Request,feature:string,userId?:string,limit=20,window=60) {
  const secret=process.env.RATE_LIMIT_SECRET||process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!secret)throw new ApiError(503,'SERVICE_NOT_CONFIGURED','서비스 연결을 준비하고 있습니다.');
  // Trust only the platform-overwritten Vercel header, never arbitrary forwarded IPs.
  const ip=process.env.VERCEL?request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'unknown':'local';
  for(const bucket of [`ip:${ip}`, ...(userId?[`user:${userId}`]:[])]) {
    const key=createHmac('sha256',secret).update(`${feature}:${bucket}`).digest('hex');
    const allowed=checked(await adminDb().rpc('consume_rate',{p_key:key,p_limit:bucket.startsWith('ip:')?limit*3:limit,p_window:window}));
    if(!allowed) throw new ApiError(429,'RATE_LIMITED','요청이 많습니다. 잠시 후 다시 시도해주세요.');
  }
}
export async function event(userId:string|null,name:string,metadata:Record<string,unknown>={}) {
  const result=await adminDb().from('event_logs').insert({user_id:userId,event_name:name,metadata});
  if(result.error)console.warn(JSON.stringify({event:'analytics_failed',code:result.error.code}));
}
export async function handle(request:Request,work:()=>Promise<unknown>) {
  const requestId=randomUUID();
  try {
    if(!['GET','HEAD'].includes(request.method)){
      const origin=request.headers.get('origin');
      const expected=new URL(process.env.APP_URL||request.url).origin;
      if(!origin||origin!==expected)throw new ApiError(403,'INVALID_ORIGIN','허용되지 않은 요청입니다.');
    }
    return Response.json(await work(),{headers:{'Cache-Control':'private, no-store','X-Request-Id':requestId}});
  }catch(error){
    const e=error instanceof ApiError?error:error instanceof z.ZodError?new ApiError(400,'VALIDATION_ERROR','입력 값을 확인해주세요.'):new ApiError(500,'INTERNAL_ERROR','처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
    console.warn(JSON.stringify({requestId,route:new URL(request.url).pathname,code:e.code}));
    return Response.json({error:{code:e.code,message:e.message,requestId}},{status:e.status,headers:{'Cache-Control':'no-store',...(e.status===429?{'Retry-After':'60'}:{})}});
  }
}
