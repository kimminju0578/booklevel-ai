"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ClientApiError } from "@/lib/client/api";
import { Button, Card } from "@/components/ui/primitives";
import { tasteQuestions, tasteQuestionVersion } from "@/lib/taste/config";

const storageKey = `booklevel:taste:${tasteQuestionVersion}`;
type Saved = { current: number; answers: Record<string, number> };
export function TasteTest() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(storageKey) || "null",
        ) as Saved | null;
        if (saved) {
          setCurrent(
            Math.min(Math.max(saved.current, 0), tasteQuestions.length - 1),
          );
          setAnswers(saved.answers || {});
        }
      } catch {
        /* discard malformed local progress */
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (ready)
      localStorage.setItem(
        storageKey,
        JSON.stringify({ current, answers } satisfies Saved),
      );
  }, [ready, current, answers]);
  const question = tasteQuestions[current];
  function select(value: number) {
    setAnswers((old) => ({ ...old, [question.id]: value }));
    setError("");
  }
  async function next() {
    if (!answers[question.id]) {
      setError("가장 가까운 답을 하나 선택해주세요.");
      return;
    }
    if (current < tasteQuestions.length - 1) {
      setCurrent((value) => value + 1);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/api/taste/complete", {
        method: "POST",
        body: JSON.stringify({ version: tasteQuestionVersion, answers }),
      });
      localStorage.setItem(
        storageKey,
        JSON.stringify({ current, answers } satisfies Saved),
      );
      router.push("/taste/result");
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "결과를 저장하지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <Card>
        <p className="reading-copy">취향 테스트를 준비하고 있어요…</p>
      </Card>
    );
  return (
    <Card className="taste-question-card">
      <div className="taste-progress-heading">
        <span>
          질문 {current + 1} <em>/ {tasteQuestions.length}</em>
        </span>
        <span>
          {Math.round(((current + 1) / tasteQuestions.length) * 100)}%
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="취향 테스트 진행률"
        aria-valuemin={0}
        aria-valuemax={tasteQuestions.length}
        aria-valuenow={current + 1}
      >
        <span
          className="progress-fill"
          style={{ width: `${((current + 1) / tasteQuestions.length) * 100}%` }}
        />
      </div>
      <fieldset className="taste-options">
        <p className="taste-question-hint">
          평소 독서 취향에 가까운 정도를 선택해주세요.
        </p>
        <legend>{question.prompt}</legend>
        <div className="taste-scale-labels">
          <span>전혀 그렇지 않아요</span>
          <span>매우 그렇습니다</span>
        </div>
        <div className="taste-scale">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className={answers[question.id] === value ? "selected" : ""}
            >
              <input
                type="radio"
                name={question.id}
                value={value}
                checked={answers[question.id] === value}
                onChange={() => select(value)}
                aria-label={`${value}점: ${value === 1 ? "전혀 그렇지 않아요" : value === 5 ? "매우 그렇습니다" : "중간 정도"}`}
              />
              <span>{value}</span>
              <small>
                {["전혀", "아닌 편", "보통", "그런 편", "매우"][value - 1]}
              </small>
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="button-row taste-navigation">
        {current > 0 && (
          <Button
            variant="quiet"
            onClick={() => setCurrent((value) => value - 1)}
          >
            ← 이전
          </Button>
        )}
        <Button onClick={() => void next()} disabled={busy}>
          {busy
            ? "결과 저장 중…"
            : current === tasteQuestions.length - 1
              ? "결과 보기"
              : "다음"}
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </Card>
  );
}
