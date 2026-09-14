import 'server-only';
import { z } from 'zod';
import type { BookProvider, BookSearchQuery, NormalizedBook } from './types';
import { cleanText, coverUrl, isbn13, validISBN } from './normalize';

async function json(url:URL,headers:Record<string,string>={}) {
 const response=await fetch(url,{headers,signal:AbortSignal.timeout(7000),next:{revalidate:3600}});
 if(!response.ok)throw new Error('CATALOG_UNAVAILABLE');
 return response.json() as Promise<unknown>;
}
const googleVolume=z.object({id:z.string(),volumeInfo:z.object({title:z.string(),subtitle:z.string().optional(),authors:z.array(z.string()).default([]),publisher:z.string().optional(),publishedDate:z.string().optional(),description:z.string().optional(),industryIdentifiers:z.array(z.object({type:z.string(),identifier:z.string()})).default([]),imageLinks:z.object({thumbnail:z.string().optional()}).optional(),language:z.string().optional(),pageCount:z.number().optional(),categories:z.array(z.string()).optional()})});
export function normalizeGoogle(input:unknown):NormalizedBook {
 const {id,volumeInfo:v}=googleVolume.parse(input);const ten=v.industryIdentifiers.find(x=>x.type==='ISBN_10')?.identifier;const thirteen=v.industryIdentifiers.find(x=>x.type==='ISBN_13')?.identifier;
 return {title:cleanText(v.title),subtitle:v.subtitle,authors:v.authors,publisher:v.publisher,publishedDate:v.publishedDate,description:v.description?cleanText(v.description).slice(0,3000):undefined,isbn10:ten?validISBN(ten):undefined,isbn13:isbn13(thirteen||ten||''),coverUrl:coverUrl(v.imageLinks?.thumbnail),language:v.language,pageCount:v.pageCount&&v.pageCount>0?v.pageCount:undefined,categories:v.categories,externalIds:{provider:'google',id}};
}
export class GoogleBooksProvider implements BookProvider {
 name='google' as const;
 async search({query,page}:BookSearchQuery) {const url=new URL('https://www.googleapis.com/books/v1/volumes');url.search=new URLSearchParams({q:query,maxResults:'20',startIndex:String((page-1)*20),printType:'books',key:process.env.GOOGLE_BOOKS_API_KEY||''}).toString();const data=z.object({items:z.array(googleVolume).default([])}).parse(await json(url));return data.items.map(normalizeGoogle)}
 async getById(id:string) {if(!/^[\w-]+$/.test(id))return null;const url=new URL('https://www.googleapis.com/books/v1/volumes/'+id);url.searchParams.set('key',process.env.GOOGLE_BOOKS_API_KEY||'');return normalizeGoogle(await json(url))}
 async getByISBN(isbn:string) {return (await this.search({query:'isbn:'+isbn,page:1})).find(b=>b.isbn13===isbn13(isbn))||null}
}
const kakaoBook=z.object({title:z.string(),authors:z.array(z.string()).default([]),publisher:z.string(),datetime:z.string(),contents:z.string(),thumbnail:z.string(),isbn:z.string()});
export class KoreanBookProvider implements BookProvider {
 name='kakao' as const;
 async search({query,page}:BookSearchQuery) {
  const url=new URL('https://dapi.kakao.com/v3/search/book');url.search=new URLSearchParams({query,page:String(Math.min(50,page)),size:'20'}).toString();
  const data=z.object({documents:z.array(kakaoBook)}).parse(await json(url,{Authorization:`KakaoAK ${process.env.KAKAO_REST_API_KEY}`}));
  return data.documents.flatMap(v=>{const ids=v.isbn.split(' ').map(validISBN).filter((s):s is string=>!!s),id=ids.find(s=>s.length===13)||ids[0];if(!id)return [];return [{title:cleanText(v.title),authors:v.authors,publisher:v.publisher,publishedDate:v.datetime.slice(0,10),description:cleanText(v.contents).slice(0,3000),coverUrl:coverUrl(v.thumbnail),isbn10:ids.find(s=>s.length===10),isbn13:isbn13(id),externalIds:{provider:'kakao' as const,id}}]});
 }
 async getById(id:string){return this.getByISBN(id)}
 async getByISBN(isbn:string){if(!validISBN(isbn))return null;return (await this.search({query:isbn,page:1})).find(b=>b.isbn13===isbn13(isbn))||null}
}
const olEdition=z.object({key:z.string(),title:z.string(),authors:z.array(z.object({key:z.string()})).default([]),publishers:z.array(z.string()).default([]),publish_date:z.string().optional(),isbn_10:z.array(z.string()).default([]),isbn_13:z.array(z.string()).default([]),covers:z.array(z.number()).default([]),number_of_pages:z.number().optional()});
export class OpenLibraryProvider implements BookProvider {
 name='openlibrary' as const;
 private headers(){return {'User-Agent':`BooklevelAI (${process.env.BOOK_PROVIDER_CONTACT||'local development'})`}}
 async search({query,page}:BookSearchQuery) {
  const url=new URL('https://openlibrary.org/search.json');url.search=new URLSearchParams({q:query,page:String(page),limit:'20',fields:'key,title,author_name,edition_key,cover_i,isbn,publisher,first_publish_year'}).toString();
  const data=z.object({docs:z.array(z.object({title:z.string(),author_name:z.array(z.string()).default([]),edition_key:z.array(z.string()).default([]),cover_i:z.number().optional()}))}).parse(await json(url,this.headers()));
  // Work-level search ISBN lists mix editions; do not assign one arbitrarily.
  return data.docs.filter(d=>d.edition_key[0]).map(d=>({title:d.title,authors:d.author_name,coverUrl:d.cover_i?`https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`:undefined,externalIds:{provider:'openlibrary' as const,id:d.edition_key[0]}}));
 }
 async getById(id:string) {
  if(!/^OL\d+M$/.test(id))return null;
  const v=olEdition.parse(await json(new URL(`https://openlibrary.org/books/${id}.json`),this.headers()));
  const authors=await Promise.all(v.authors.slice(0,3).map(async a=>{if(!/^\/authors\/OL\d+A$/.test(a.key))return '';return z.object({name:z.string()}).parse(await json(new URL(`https://openlibrary.org${a.key}.json`),this.headers())).name}));
  return {title:v.title,authors:authors.filter(Boolean),publisher:v.publishers[0],isbn10:validISBN(v.isbn_10[0]||''),isbn13:isbn13(v.isbn_13[0]||v.isbn_10[0]||''),coverUrl:v.covers[0]?`https://covers.openlibrary.org/b/id/${v.covers[0]}-L.jpg`:undefined,pageCount:v.number_of_pages,externalIds:{provider:'openlibrary' as const,id}};
 }
 async getByISBN(isbn:string){if(!validISBN(isbn))return null;const v=olEdition.parse(await json(new URL(`https://openlibrary.org/isbn/${isbn}.json`),this.headers()));return this.getById(v.key.split('/').pop()!)}
}
export function providers():BookProvider[] {return [...(process.env.KAKAO_REST_API_KEY?[new KoreanBookProvider()]:[]),...(process.env.GOOGLE_BOOKS_API_KEY?[new GoogleBooksProvider()]:[]),...(process.env.OPEN_LIBRARY_ENABLED==='true'&&process.env.BOOK_PROVIDER_CONTACT?[new OpenLibraryProvider()]:[])];}
