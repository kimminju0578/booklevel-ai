"use client";

import { useRef, useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { Card, Button, EmptyState, EssayScore, Progress } from "@/components/ui/primitives";

type Evaluation = { scores: { understanding: number; thesis: number; reasoning: number; evidence: number; counterargument: number; structure: number; expression: number; total: number }; strengths: string[]; weaknesses: string[]; rewrite_goal: string; guiding_question: string };
const rows: [keyof Evaluation["scores"], string, number][] = [["understanding", "논제 이해", 15], ["thesis", "주장 명확성", 15], ["reasoning", "논거 타당성", 20], ["evidence", "근거 활용", 15], ["counterargument", "반론·재반론", 15], ["structure", "구조·일관성", 10], ["expression", "표현력", 10]];
const question = "책을 읽고 가장 중요하다고 생각한 주장에 동의하거나 반대하는 이유를 근거와 예상 반론을 포함해 논술하세요.";

export function DemoCoach() {
  const [content, setContent] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success" | "empty" | "error">("idle");
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);
  async function evaluate() {
    if (inFlight.current) return;
    if (content.trim().length < 20) { setState("empty"); setMessage("답안을 20자 이상 작성해주세요."); return; }
    inFlight.current = true; setState("loading"); setMessage("");
    try { const result = await api<{ evaluation: Evaluation }>("/api/demo/evaluate", { method: "POST", body: JSON.stringify({ question, content }) }); setEvaluation(result.evaluation); setState("success"); }
    catch (error) { setState("error"); setMessage(error instanceof ClientApiError ? error.message : "평가 중 문제가 발생했습니다."); }
    finally { inFlight.current = false; }
  }
  return <Card className="demo-coach"><p className="eyebrow">OPENAI READING COACH · DEMO</p><h2>내 생각을 AI와 함께 정리해보세요.</h2><p className="reading-copy page-section">{question}</p><label className="upload-label" htmlFor="demo-answer">나의 답안 · {content.length.toLocaleString()}자</label><textarea id="demo-answer" className="essay-editor" value={content} maxLength={10000} onChange={(event) => { setContent(event.target.value); if (state !== "loading") setState("idle"); }} placeholder="주장과 근거, 예상 반론을 차분히 적어보세요." />{(state === "empty" || state === "error") && <p className="error-message" role="alert">{message}</p>}<div className="button-row"><Button onClick={evaluate} disabled={state === "loading"}>{state === "loading" ? "AI가 읽는 중…" : "AI 피드백 받기"}</Button></div>{state === "success" && evaluation ? <section className="demo-feedback page-section" aria-live="polite"><EssayScore total={evaluation.scores.total}/>{rows.map(([key, label, max]) => <Progress key={key} label={label} value={evaluation.scores[key]} max={max}/>)}<h3>잘한 점</h3><ul>{evaluation.strengths.map((item) => <li key={item}>{item}</li>)}</ul><h3>보완할 점</h3><ul>{evaluation.weaknesses.map((item) => <li key={item}>{item}</li>)}</ul><h3>다시 쓰기 목표</h3><p>{evaluation.rewrite_goal}</p><h3>생각을 여는 질문</h3><p>{evaluation.guiding_question}</p></section> : state === "idle" ? <EmptyState title="답안을 작성하면 피드백이 나타납니다.">OpenAI가 답안의 구조와 논리를 읽고 학습 참고용 피드백을 제공합니다.</EmptyState> : null}</Card>;
}
