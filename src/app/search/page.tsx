import type { Metadata } from "next";
import { BookSearch } from "@/components/books/book-search";
import { PageShell } from "@/components/ui/site-shell";
import { DemoPage } from "@/components/demo/demo-page";
import { configured } from "@/lib/server/env";
export const metadata: Metadata={title:"책 검색 · BOOKLEVEL",description:"제목, 저자, ISBN으로 실제 도서를 검색합니다."};
export default function SearchPage(){return <PageShell active="책 찾기" eyebrow="FIND YOUR NEXT BOOK" title="궁금한 책을 찾아보세요." description="BOOKLEVEL 도서와 연결된 외부 도서 제공처를 함께 검색합니다.">{configured() ? <BookSearch/> : <DemoPage title="샘플 도서 찾기" description="데모에서는 추천 메뉴에서 준비된 도서를 확인할 수 있어요." />}</PageShell>}
