export class ApiError extends Error {
  constructor(public status:number,public code:string,message:string) {super(message)}
}
export function checked<T>(result: {data:T;error:{message:string;code?:string}|null}):T;
export function checked(result: {error:{message:string;code?:string}|null}):undefined;
export function checked<T>(result: {data?:T;error:{message:string;code?:string}|null}):T|undefined {
  if(result.error){
    const message=result.error.message;
    if(message.includes('NOT_FOUND')) throw new ApiError(404,'NOT_FOUND','정보를 찾을 수 없습니다.');
    if(message.includes('QUESTION_BANK_INCOMPLETE')) throw new ApiError(409,'QUESTION_BANK_INCOMPLETE','검수된 진단 문항을 준비하고 있습니다.');
    if(message.includes('REVISION_CONFLICT')) throw new ApiError(409,'REVISION_CONFLICT','다른 창에서 내용이 변경되었습니다. 작성 내용을 복사한 후 새로고침해주세요.');
    if(message.includes('ALREADY_SUBMITTED')) throw new ApiError(409,'ALREADY_SUBMITTED','이미 제출한 답안입니다.');
    if(result.error.code==='23505') throw new ApiError(409,'DUPLICATE','이미 등록된 내용입니다.');
    if(result.error.code==='23514'||message.includes('INVALID_')||message.includes('ESSAY_TOO_SHORT')) throw new ApiError(400,'INVALID_INPUT','입력 내용을 확인해주세요.');
    throw new ApiError(500,'DATABASE_ERROR','정보를 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
  return result.data;
}
