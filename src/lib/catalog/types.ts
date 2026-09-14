import { z } from "zod";

export const providerName=z.enum(['google','kakao','openlibrary']);
export type ProviderName=z.infer<typeof providerName>;
export const normalizedBookSchema=z.object({isbn10:z.string().optional(),isbn13:z.string().optional(),title:z.string().min(1).max(500),subtitle:z.string().max(500).optional(),authors:z.array(z.string().max(200)).max(30),publisher:z.string().max(300).optional(),publishedDate:z.string().optional(),description:z.string().max(3000).optional(),coverUrl:z.string().optional(),language:z.string().optional(),pageCount:z.number().int().positive().optional(),categories:z.array(z.string()).optional(),externalIds:z.object({provider:providerName,id:z.string().min(1).max(200)})});
export type NormalizedBook=z.infer<typeof normalizedBookSchema>;
export type BookSearchQuery={query:string;page:number};
export interface BookProvider { name:ProviderName; search(query:BookSearchQuery):Promise<NormalizedBook[]>; getByISBN(isbn:string):Promise<NormalizedBook|null>; getById(id:string):Promise<NormalizedBook|null>; }
