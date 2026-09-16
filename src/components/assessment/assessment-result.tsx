"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import {
  Button,
  Card,
  EmptyState,
  InsightCard,
  LevelBadge,
  Progress,
} from "@/components/ui/primitives";
type Result = {
  id: string;
  score: number;
  calculated_level: number;
  topic_scores: Record<string, number>;
  completed_at: string;
  questions: {
    id: string;
    question: string;
    topic: string;
    options: { id: string; text: string }[];
    correctOption: string;
    selectedOption: string | null;
    isCorrect: boolean;
    explanation: string;
  }[];
};
export function AssessmentResult() {
  const params = useSearchParams();
  const attempt = params.get("attempt");
  const [result, setResult] = useState<Result | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">(
    attempt ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    attempt ? "" : "완료한 진단 정보가 없습니다.",
  );
  const load = async () => {
    if (!attempt) return;
    setState("loading");
    try {
      setResult(await api<Result>(`/api/assessment/${attempt}`));
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "결과를 불러오지 못했습니다.",
      );
      setState("error");
    }
  };
  useOnMount(load);
  if (state === "loading")
    return (
      <div className="skeleton-grid">
        <i />
        <i />
      </div>
    );
  if (state === "error" || !result)
    return (
      <Card>
        <EmptyState
          title="진단 결과를 불러오지 못했어요."
          action={
            attempt ? (
              <Button variant="secondary" onClick={load}>
                다시 시도
              </Button>
            ) : (
              <Link className="button button--secondary" href="/onboarding">
                관심 분야 선택
              </Link>
            )
          }
        >
          {message}
        </EmptyState>
      </Card>
    );
  return (
    <>
      <div className="result-layout">
        <Card variant="soft" tone="sand" className="level-result">
          <p className="eyebrow">MY BOOKLEVEL</p>
          <h2>나의 현재 위치</h2>
          <span className="level-number">
            {result.calculated_level.toFixed(1)}
          </span>
          <LevelBadge level={result.calculated_level} />
          <p className="reading-copy page-section">
            정답률 {Math.round(result.score * 100)}%를 바탕으로 계산한 이 분야의
            현재 출발점입니다.
          </p>
        </Card>
        <Card className="topic-card">
          <h2>주제별 이해도</h2>
          {Object.entries(result.topic_scores).map(([topic, value]) => (
            <Progress
              key={topic}
              label={topic}
              value={Math.round(value * 100)}
              max={100}
            />
          ))}
        </Card>
      </div>
      <InsightCard title="결과는 다음 독서를 위한 안내예요.">
        <p>
          지능이나 학업 능력의 판단이 아니며, 새로운 진단을 완료하면 최신 결과로
          갱신됩니다.
        </p>
      </InsightCard>
      <Card className="assessment-review">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ANSWER REVIEW</p>
            <h2>정답과 해설</h2>
          </div>
        </div>
        <div className="assessment-review-list" aria-live="polite">
          {result.questions.map((question, index) => {
            const selected = question.options.find(
              (option) => option.id === question.selectedOption,
            )?.text;
            const correct = question.options.find(
              (option) => option.id === question.correctOption,
            )?.text;
            return (
              <article className="assessment-review-item" key={question.id}>
                <strong>
                  {index + 1}. {question.question}
                </strong>
                <p
                  className={
                    question.isCorrect ? "answer-correct" : "answer-wrong"
                  }
                >
                  {question.isCorrect ? "정답입니다." : "오답입니다."}
                </p>
                <p>
                  <b>내 선택:</b> {selected ?? "선택 없음"}
                </p>
                <p>
                  <b>정답:</b> {correct ?? question.correctOption}
                </p>
                <p className="reading-copy">
                  <b>해설:</b>{" "}
                  {question.explanation || "이 문항의 해설을 준비 중입니다."}
                </p>
              </article>
            );
          })}
        </div>
      </Card>
      <div className="button-row">
        <Link className="button button--primary" href="/recommendations">
          맞춤 책 추천받기
        </Link>
        <Link className="button button--secondary" href="/home">
          나의 홈
        </Link>
      </div>
    </>
  );
}
