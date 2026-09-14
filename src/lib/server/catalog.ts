import 'server-only';
import { z } from 'zod';
import { providers } from '@/lib/catalog/providers';
import { deduplicate } from '@/lib/catalog/normalize';
import { normalizedBookSchema, providerName } from '@/lib/catalog/types';
import { bookRow, pageSchema } from '@/lib/domain/schemas';
import { adminDb, identity, requireUser } from './db';
import { body, event, rateLimit } from './http';
import { ApiError, checked } from './errors';

export async function searchBooks(request:Request) {
 const q=z.string().trim().min(1).max(120).parse(new URL(request.url).searchParams.get('q'));
 const page=pageSchema.parse(new URL(request.url).searchParams.get('page')||1);
 const {db,user}=await identity(false);await rateLimit(request,'book-search',user?.id,20);
 const local=bookRow.array().parse(checked(await db.rpc('search_books',{p_query:q,p_page:page})));
 let warning:string|null=null;let external:z.infer<typeof normalizedBookSchema>[]=[];
 if(local.length<20){const sources=providers();const results=await Promise.allSettled(sources.map(p=>p.search({query:q,page})));external=deduplicate(results.flatMap(r=>r.status==='fulfilled'?r.value:[]));if(!sources.length||results.some(r=>r.status==='rejected'))warning='외부 도서 검색이 일시적으로 제한되었습니다. BOOKLEVEL에 등록된 책을 먼저 보여드리고 있습니다.'}
 const isbns=new Set(local.map(b=>b.isbn13).filter(Boolean));external=external.filter(b=>!b.isbn13||!isbns.has(b.isbn13)).slice(0,20-local.length);
 await event(user?.id||null,'book_search',{page,localCount:local.length,externalCount:external.length});
 return {local,external,warning,page,hasMore:local.length+external.length===20};
}
export async function importBook(request:Request) {
 const {user}=await requireUser();await rateLimit(request,'book-import',user.id,20);
 const input=await body(request,z.object({provider:providerName,externalId:z.string().min(1).max(200)}).strict());
 const provider=providers().find(p=>p.name===input.provider);if(!provider)throw new ApiError(503,'PROVIDER_UNAVAILABLE','도서 정보 제공자 연결이 필요합니다.');
 let raw;try{raw=await provider.getById(input.externalId)}catch{throw new ApiError(502,'PROVIDER_UNAVAILABLE','도서 정보를 가져오지 못했습니다. 다시 시도해주세요.')}
 if(!raw)throw new ApiError(404,'NOT_FOUND','해당 도서 정보를 찾을 수 없습니다.');
 const b=normalizedBookSchema.parse(raw);
 const date=b.publishedDate&&/^\d{4}-\d{2}-\d{2}$/.test(b.publishedDate)?b.publishedDate:null;
 const id=checked(await adminDb().rpc('import_book',{p_book:{isbn10:b.isbn10,isbn13:b.isbn13,title:b.title,subtitle:b.subtitle,authors:b.authors,publisher:b.publisher,published_date:date,description:b.description,cover_url:b.coverUrl,language:b.language,page_count:b.pageCount,source_provider:b.externalIds.provider,source_id:b.externalIds.id}}));
 await event(user.id,'external_book_imported',{bookId:id,provider:input.provider});return {bookId:id};
}
