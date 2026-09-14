"use client";
import { Button } from "@/components/ui/primitives";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className="shell app-page"><div className="empty-state"><span className="empty-symbol" aria-hidden="true">!</span><h1>페이지를 불러오지 못했습니다.</h1><p className="reading-copy">잠시 후 다시 시도해주세요.</p><Button onClick={reset}>다시 시도</Button></div></main>}
