import type { NormalizedBook } from './types';

export function cleanText(value:string) {return value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
export function validISBN(value:string):string|undefined {
 const s=value.replace(/[\s-]/g,'').toUpperCase();
 if(/^\d{13}$/.test(s)&&[...s].reduce((sum,n,i)=>sum+Number(n)*(i%2?3:1),0)%10===0)return s;
 if(/^\d{9}[\dX]$/.test(s)&&[...s].reduce((sum,n,i)=>sum+(n==='X'?10:Number(n))*(10-i),0)%11===0)return s;
 return undefined;
}
export function isbn13(value:string) {
 const isbn=validISBN(value);if(!isbn)return undefined;if(isbn.length===13)return isbn;
 const base='978'+isbn.slice(0,9),sum=[...base].reduce((s,n,i)=>s+Number(n)*(i%2?3:1),0);
 return base+((10-sum%10)%10);
}
export function normalizedKey(book:NormalizedBook) {
 const isbn=isbn13(book.isbn13||book.isbn10||''); if(isbn)return 'isbn:'+isbn;
 if(!book.publisher||book.authors.length===0)return `provider:${book.externalIds.provider}:${book.externalIds.id}`;
 const norm=(s:string)=>s.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
 return 'metadata:'+norm([book.title,book.authors.join('|'),book.publisher,book.publishedDate||''].join('::'));
}
export function deduplicate(books:NormalizedBook[]) {
 const seen=new Set<string>();return books.filter(b=>{const key=normalizedKey(b);if(seen.has(key))return false;seen.add(key);return true});
}
export function coverUrl(value:string|undefined):string|undefined {
 if(!value)return undefined;
 try{const u=new URL(value);if(u.protocol==='http:')u.protocol='https:';if(u.protocol!=='https:')return undefined;return u.toString()}catch{return undefined}
}
