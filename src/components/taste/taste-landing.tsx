"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui/primitives";
import { tasteQuestionVersion, tasteQuestions } from "@/lib/taste/config";

const storageKey = `booklevel:taste:${tasteQuestionVersion}`;
export function TasteLanding() {
  const [hasProgress, setHasProgress] = useState(false);
  const router = useRouter();
  useEffect(() => { const timer = window.setTimeout(() => { try { const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as { answers?: Record<string, number> } | null; setHasProgress(Boolean(saved?.answers && Object.keys(saved.answers).length)); } catch { setHasProgress(false); } }, 0); return () => window.clearTimeout(timer); }, []);
  function restart() { localStorage.removeItem(storageKey); router.push("/taste/test"); }
  return <div className="taste-landing">
    <Card variant="soft" tone="blue" className="taste-intro-card"><p className="eyebrow">READING TASTE TEST</p><h2>나는 어떤 독자일까?</h2><p className="reading-copy">12개의 질문으로 나의 독서 취향을 알아보고, 나와 잘 맞는 책을 찾아보세요.</p><div className="taste-facts"><span>12문항</span><span>약 2분</span><span>정답 없음</span></div>{hasProgress ? <div className="button-row"><Link className="button button--primary" href="/taste/test">이어서 하기 <span aria-hidden="true">→</span></Link><Button variant="quiet" onClick={restart}>처음부터 다시</Button></div> : <Link className="button button--primary" href="/taste/test">취향 테스트 시작하기 <span aria-hidden="true">→</span></Link>}</Card>
    <div className="taste-explainer"><p className="eyebrow">BOOKLEVEL TEST와 달라요</p><h2>능력이 아니라, 끌림을 알아보는 시간.</h2><p className="reading-copy">BookLevel은 지금 읽을 수 있는 수준을, Reading Taste Test는 어떤 방식의 책을 좋아할 가능성이 높은지를 살펴봅니다.</p><p className="caption">현재 질문 수 · {tasteQuestions.length}개</p></div>
  </div>;
}
