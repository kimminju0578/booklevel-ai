import type { Metadata } from "next";
import { BookSearch } from "@/components/books/book-search";
import { PageShell } from "@/components/ui/site-shell";
export const metadata: Metadata={title:"책 검색 · BOOKLEVEL",description:"제목, 저자, ISBN으로 실제 도서를 검색합니다."};
export default function SearchPage(){return <PageShell active="책 찾기" eyebrow="FIND YOUR NEXT BOOK" title="궁금한 책을 찾아보세요." description="BOOKLEVEL 도서와 연결된 외부 도서 제공처를 함께 검색합니다."><BookSearch/></PageShell>}
