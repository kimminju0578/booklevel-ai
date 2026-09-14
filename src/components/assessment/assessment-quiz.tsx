"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Progress,
} from "@/components/ui/primitives";

type Category = { id: string; slug: string; name: string };
type Question = {
  id: string;
  question: string;
  level: number;
  topic: string;
  options: { id: string; text: string }[];
};
type Attempt = { attemptId: string; questions: Question[] };

export function AssessmentQuiz({ categorySlug }: { categorySlug: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, setState] = useState<
    "loading" | "ready" | "submitting" | "error"
  >("loading");
  const [message, setMessage] = useState("");
  const start = async () => {
    setState("loading");
    setMessage("");
    try {
      const data = await api<{ categories: Category[] }>("/api/categories");
      const category = data.categories.find(
        (item) => item.slug === categorySlug,
      );
      if (!category) throw new Error("분야를 찾을 수 없습니다.");
      const next = await api<Attempt>("/api/assessment/start", {
        method: "POST",
        body: JSON.stringify({ categoryId: category.id }),
      });
      setAttempt(next);
      setIndex(0);
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "진단을 시작하지 못했습니다.",
      );
      setState("error");
    }
  };
  useOnMount(start);
  const question = attempt?.questions[index];
  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  async function submit() {
    if (!attempt || answered !== attempt.questions.length) return;
    setState("submitting");
    setMessage("");
    try {
      await api("/api/assessment/submit", {
        method: "POST",
        body: JSON.stringify({
          attemptId: attempt.attemptId,
          answers: attempt.questions.map((item) => ({
            questionId: item.id,
            selectedOption: answers[item.id],
          })),
        }),
      });
      router.push(`/assessment/result?attempt=${attempt.attemptId}`);
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "진단을 제출하지 못했습니다.",
      );
      setState("ready");
    }
  }
  if (state === "loading")
    return (
      <div className="assessment-layout">
        <div className="skeleton-panel" />
        <div className="skeleton-panel" />
      </div>
    );
  if (state === "error" || !question)
    return (
      <Card>
        <EmptyState
          title="진단을 시작하지 못했어요."
          action={
            <Button variant="secondary" onClick={start}>
              다시 시도
            </Button>
          }
        >
          {message}
        </EmptyState>
      </Card>
    );
  return (
    <div className="assessment-layout">
      <Card className="question-card">
        <div className="question-topline">
          <Badge>
            {index + 1} / {attempt.questions.length}
          </Badge>
          <span>{question.topic}</span>
        </div>
        <Progress
          value={answered}
          max={attempt.questions.length}
          label="답변 완료"
        />
        <h2>{question.question}</h2>
        <fieldset className="question-options">
          <legend>가장 알맞다고 생각하는 답을 선택하세요.</legend>
          {question.options.map((option) => (
            <label className="answer-option" key={option.id}>
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={answers[question.id] === option.id}
                onChange={() =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: option.id,
                  }))
                }
              />
              <span>{option.text}</span>
            </label>
          ))}
        </fieldset>
        {message && (
          <p className="error-message" role="alert">
            {message}
          </p>
        )}
        <div className="button-row">
          <Button
            variant="secondary"
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
            disabled={index === 0}
          >
            이전
          </Button>
          {index < attempt.questions.length - 1 ? (
            <Button
              onClick={() =>
                setIndex((value) =>
                  Math.min(attempt.questions.length - 1, value + 1),
                )
              }
              disabled={!answers[question.id]}
            >
              다음
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={
                answered !== attempt.questions.length || state === "submitting"
              }
            >
              {state === "submitting" ? "결과 계산 중…" : "진단 완료"}
            </Button>
          )}
        </div>
      </Card>
      <aside className="assessment-aside">
        <Card>
          <h2>문항 바로가기</h2>
          <div className="question-jump">
            {attempt.questions.map((item, position) => (
              <button
                type="button"
                key={item.id}
                aria-label={`${position + 1}번 문항${answers[item.id] ? ", 답변 완료" : ""}`}
                aria-current={position === index ? "step" : undefined}
                data-answered={!!answers[item.id]}
                onClick={() => setIndex(position)}
              >
                {position + 1}
              </button>
            ))}
          </div>
          <p className="caption page-section">
            답을 선택한 문항은 채워진 번호로 표시됩니다. 제출 전 언제든 수정할
            수 있어요.
          </p>
        </Card>
      </aside>
    </div>
  );
}
