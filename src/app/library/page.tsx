import type { Metadata } from "next";
import { LibraryClient } from "@/components/books/library-client";
import { PageShell } from "@/components/ui/site-shell";
export const metadata:Metadata={title:"내 서재 · BOOKLEVEL",robots:{index:false,follow:false}};
export default function LibraryPage(){return <PageShell active="내 서재" eyebrow="YOUR LIBRARY" title="읽고 싶은 책과 읽은 책." description="나의 독서 상태와 기록을 한곳에서 이어보세요."><LibraryClient/></PageShell>}
