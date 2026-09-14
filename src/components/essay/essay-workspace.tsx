"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { formatDuration } from "@/lib/domain/scoring";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  EssayScore,
  Progress,
} from "@/components/ui/primitives";

type Category = { id: string; name: string };
type Question = {
  id: string;
  question: string;
  difficulty: number;
  practice_type: string;
  target_skill: string | null;
  source: string;
};
type Evaluation = {
  total_score: number;
  understanding_score: number;
  thesis_score: number;
  reasoning_score: number;
  evidence_score: number;
  counterargument_score: number;
  structure_score: number;
  expression_score: number;
  strengths: string[];
  weaknesses: string[];
  rewrite_goal: string;
  guiding_question: string;
  time_feedback: string;
};
type Draft = {
  attempt: {
    id: string;
    mode: "practice" | "timed";
    time_limit_seconds: number | null;
    started_at: string;
    submitted_at: string | null;
    elapsed_seconds: number | null;
    overtime_seconds: number;
  };
  essay: {
    id: string;
    content: string;
    revision: number;
    version: number;
    evaluation_state: string;
    is_public: boolean;
    show_score_publicly: boolean;
  };
  question: Question;
  evaluation: Evaluation | null;
  serverNow: string;
};
type HistoryRow = {
  id: string;
  attempt_id: string;
  version: number;
  evaluation_state: string;
  created_at: string;
  essay_attempts: {
    practice_type: string;
    difficulty: number;
    elapsed_seconds: number | null;
    overtime_seconds: number;
    character_count: number | null;
    submitted_at: string | null;
  } | null;
  essay_evaluations: {
    total_score: number;
    rewrite_goal: string;
    time_feedback: string;
  } | null;
};
const practiceLabels = {
  book_based: "책 기반 논술",
  topic_based: "자유 주제 논술",
  weakness_training: "약점 집중 훈련",
  random: "랜덤 문제",
  timed_exam: "시간 제한 실전",
};
const scoreRows: [keyof Evaluation, string, number][] = [
  ["understanding_score", "논제 이해", 15],
  ["thesis_score", "주장 명확성", 15],
  ["reasoning_score", "논거 타당성", 20],
  ["evidence_score", "근거 활용", 15],
  ["counterargument_score", "반론·재반론", 15],
  ["structure_score", "구조·일관성", 10],
  ["expression_score", "표현력", 10],
];

export function EssayWorkspace() {
  const params = useSearchParams();
  const bookId = params.get("bookId") || undefined;
  const restoreAttempt = params.get("attempt");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [practiceType, setPracticeType] = useState<keyof typeof practiceLabels>(
    bookId ? "book_based" : "topic_based",
  );
  const [difficulty, setDifficulty] = useState(3);
  const [targetSkill, setTargetSkill] = useState("reasoning");
  const [limit, setLimit] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [content, setContent] = useState("");
  const [revision, setRevision] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [state, setState] = useState<
    | "loading"
    | "setup"
    | "generating"
    | "writing"
    | "saving"
    | "submitting"
    | "done"
    | "error"
  >("loading");
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const loadedAt = useRef(0);
  const requestInFlight = useRef(false);
  const loadDraft = async (attemptId: string) => {
    const data = await api<Draft>(`/api/essay/attempts/${attemptId}`);
    setDraft(data);
    setContent(data.essay.content);
    setRevision(data.essay.revision);
    setElapsed(
      Math.max(
        0,
        Math.floor(
          (Date.parse(data.serverNow) - Date.parse(data.attempt.started_at)) /
            1000,
        ),
      ),
    );
    loadedAt.current = Date.now();
    setState(data.attempt.submitted_at ? "done" : "writing");
  };
  const loadHistory = async () => {
    try {
      const data = await api<{ essays: HistoryRow[] }>("/api/essay/history");
      setHistory(data.essays);
    } catch {
      /* History is secondary to the active editor. */
    }
  };
  useEffect(() => {
    void (async () => {
      try {
        const data = await api<{ categories: Category[] }>("/api/categories");
        setCategories(data.categories);
        setCategoryId(data.categories[0]?.id || "");
        if (restoreAttempt) await loadDraft(restoreAttempt);
        else setState("setup");
        await loadHistory();
      } catch (caught) {
        setMessage(
          caught instanceof ClientApiError
            ? caught.message
            : "논술 공간을 준비하지 못했습니다.",
        );
        setState("error");
      }
    })();
  }, [restoreAttempt]);
  useEffect(() => {
    if (!draft || draft.attempt.submitted_at) return;
    const timer = window.setInterval(
      () =>
        setElapsed(
          Math.max(
            0,
            Math.floor(
              (Date.parse(draft.serverNow) -
                Date.parse(draft.attempt.started_at) +
                (Date.now() - loadedAt.current)) /
                1000,
            ),
          ),
        ),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [draft]);
  const remaining = useMemo(
    () =>
      draft?.attempt.time_limit_seconds === null ||
      draft?.attempt.time_limit_seconds === undefined
        ? null
        : draft.attempt.time_limit_seconds - elapsed,
    [draft, elapsed],
  );
  async function create(event: FormEvent) {
    event.preventDefault();
    if (practiceType === "book_based" && !bookId) {
      setMessage("책 상세에서 ‘이 책으로 논술 연습’을 선택해주세요.");
      return;
    }
    setState("generating");
    setMessage("");
    setWarning("");
    try {
      const generated = await api<{
        question: Question;
        warning: string | null;
      }>("/api/essay/questions/generate", {
        method: "POST",
        body: JSON.stringify({
          bookId,
          categoryId: categoryId || undefined,
          difficulty,
          practiceType,
          targetSkill:
            practiceType === "weakness_training" ? targetSkill : undefined,
        }),
      });
      setWarning(generated.warning || "");
      const mode = limit === null ? "practice" : "timed";
      const started = await api<{ attemptId: string }>("/api/essay/attempts", {
        method: "POST",
        body: JSON.stringify({
          questionId: generated.question.id,
          mode,
          timeLimitSeconds: limit,
        }),
      });
      await loadDraft(started.attemptId);
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "논술 문제를 만들지 못했습니다.",
      );
      setState("setup");
    }
  }
  const save = useCallback(async () => {
    if (!draft || !dirty) return;
    setState("saving");
    try {
      const result = await api<{ essay: { revision: number } }>(
        `/api/essay/attempts/${draft.attempt.id}/autosave`,
        { method: "PUT", body: JSON.stringify({ content, revision }) },
      );
      setRevision(result.essay.revision);
      setDirty(false);
      setState("writing");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "자동 저장하지 못했습니다. 내용을 복사해 보관해주세요.",
      );
      setState("writing");
    }
  }, [content, dirty, draft, revision]);
  useEffect(() => {
    if (!draft || !dirty || draft.attempt.submitted_at) return;
    const timer = window.setTimeout(() => {
      void save();
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [dirty, draft, save]);
  async function submit() {
    if (!draft || requestInFlight.current || content.trim().length < 20) return;
    requestInFlight.current = true;
    setState("submitting");
    setMessage("");
    try {
      const result = await api<{
        essayId: string;
        evaluation: Evaluation | null;
        warning: string | null;
      }>(`/api/essay/attempts/${draft.attempt.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ content, revision }),
      });
      setWarning(result.warning || "");
      await loadDraft(draft.attempt.id);
      await loadHistory();
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "답안을 제출하지 못했습니다.",
      );
      setState("writing");
    } finally {
      requestInFlight.current = false;
    }
  }
  async function retryEvaluation() {
    if (!draft || requestInFlight.current) return;
    requestInFlight.current = true;
    setState("submitting");
    try {
      const result = await api<{
        evaluation: Evaluation | null;
        warning: string | null;
      }>(`/api/essay/evaluations/${draft.essay.id}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setWarning(result.warning || "");
      await loadDraft(draft.attempt.id);
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "평가를 다시 시도하지 못했습니다.",
      );
      setState("done");
    } finally {
      requestInFlight.current = false;
    }
  }
  async function rewrite() {
    if (!draft) return;
    try {
      const result = await api<{ attemptId: string }>(
        `/api/essay/${draft.essay.id}/rewrite`,
        { method: "POST", body: JSON.stringify({}) },
      );
      await loadDraft(result.attemptId);
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "다시 쓰기를 시작하지 못했습니다.",
      );
    }
  }
  if (state === "loading")
    return (
      <div className="skeleton-grid">
        <i />
        <i />
      </div>
    );
  if (state === "error")
    return (
      <Card>
        <EmptyState
          title="논술 공간을 준비하지 못했어요."
          action={
            <Link className="button button--secondary" href="/login">
              로그인
            </Link>
          }
        >
          {message}
        </EmptyState>
      </Card>
    );
  return (
    <>
      {state === "setup" || state === "generating" ? (
        <Card className="essay-setup">
          <form className="form-stack" onSubmit={create}>
            <div className="form-row">
              <label>
                연습 유형
                <select
                  className="select-control"
                  value={practiceType}
                  onChange={(event) =>
                    setPracticeType(
                      event.target.value as keyof typeof practiceLabels,
                    )
                  }
                >
                  {Object.entries(practiceLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                난이도
                <select
                  className="select-control"
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(Number(event.target.value))
                  }
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      Level {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                분야
                <select
                  className="select-control"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <option value="">분야 무관</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                타이머
                <select
                  className="select-control"
                  value={limit ?? ""}
                  onChange={(event) =>
                    setLimit(
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                >
                  <option value="">자유 연습</option>
                  <option value="600">10분</option>
                  <option value="1200">20분</option>
                  <option value="1800">30분</option>
                </select>
              </label>
            </div>
            {practiceType === "weakness_training" && (
              <label>
                집중 역량
                <select
                  className="select-control"
                  value={targetSkill}
                  onChange={(event) => setTargetSkill(event.target.value)}
                >
                  <option value="understanding">논제 이해</option>
                  <option value="thesis">주장 명확성</option>
                  <option value="reasoning">논거 타당성</option>
                  <option value="evidence">근거 활용</option>
                  <option value="counterargument">반론·재반론</option>
                  <option value="structure">구조·일관성</option>
                  <option value="expression">표현력</option>
                </select>
              </label>
            )}
            {practiceType === "book_based" && !bookId && (
              <p className="notice-message">
                책 기반 연습은 <Link href="/search">책을 검색</Link>한 뒤 상세
                페이지에서 시작해주세요.
              </p>
            )}
            {bookId && (
              <p className="notice-message">
                선택한 책의 검증된 메타데이터만 사용해 논제를 만듭니다.
              </p>
            )}
            {message && (
              <p className="error-message" role="alert">
                {message}
              </p>
            )}
            <Button type="submit" disabled={state === "generating"}>
              {state === "generating" ? "논제 만드는 중…" : "논술 연습 시작"}
            </Button>
          </form>
        </Card>
      ) : (
        draft && (
          <>
            <div className="essay-toolbar">
              <div>
                <Badge tone="teal">
                  {practiceLabels[
                    draft.question.practice_type as keyof typeof practiceLabels
                  ] ?? "논술 연습"}
                </Badge>
                <span className="save-state">
                  {state === "saving"
                    ? "저장 중…"
                    : dirty
                      ? "저장 대기"
                      : "저장됨"}
                </span>
              </div>
              <div
                className={
                  remaining !== null && remaining < 0
                    ? "timer overtime"
                    : "timer"
                }
              >
                {remaining === null
                  ? `경과 ${formatDuration(elapsed)}`
                  : remaining >= 0
                    ? `남은 시간 ${formatDuration(remaining)}`
                    : `초과 ${formatDuration(-remaining)}`}
              </div>
            </div>
            <Card variant="soft" tone="teal">
              <p className="eyebrow">WRITING QUESTION</p>
              <h2>{draft.question.question}</h2>
              <p className="caption page-section">
                난이도 Level {draft.question.difficulty} · 시간은 글의 질 점수에
                반영되지 않습니다.
              </p>
            </Card>
            <div className="two-columns page-section">
              <Card>
                <label className="upload-label" htmlFor="essay-content">
                  나의 답안 · {content.length.toLocaleString()}자
                </label>
                <textarea
                  id="essay-content"
                  className="essay-editor"
                  value={content}
                  maxLength={10000}
                  readOnly={!!draft.attempt.submitted_at}
                  onChange={(event) => {
                    setContent(event.target.value);
                    setDirty(true);
                  }}
                  placeholder="주장과 근거, 예상 반론을 차분히 적어보세요."
                />
                <div className="button-row">
                  {!draft.attempt.submitted_at ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={save}
                        disabled={!dirty || state === "saving"}
                      >
                        지금 저장
                      </Button>
                      <Button
                        onClick={submit}
                        disabled={
                          content.trim().length < 20 || state === "submitting"
                        }
                      >
                        {state === "submitting" ? "평가 중…" : "답안 제출"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="secondary" onClick={rewrite}>
                        피드백으로 다시 쓰기
                      </Button>
                      {!draft.evaluation && (
                        <Button
                          onClick={retryEvaluation}
                          disabled={state === "submitting"}
                        >
                          AI 평가 다시 시도
                        </Button>
                      )}
                    </>
                  )}
                </div>
                {message && (
                  <p className="error-message" role="alert">
                    {message}
                  </p>
                )}
                {warning && <p className="notice-message">{warning}</p>}
              </Card>
              <Card>
                <h2>학습 피드백</h2>
                {draft.evaluation ? (
                  <>
                    <EssayScore total={draft.evaluation.total_score} />
                    <div className="page-section">
                      {scoreRows.map(([key, label, max]) => (
                        <Progress
                          key={key}
                          label={label}
                          value={draft.evaluation?.[key] as number}
                          max={max}
                          tone={key === "reasoning_score" ? "teal" : "blue"}
                        />
                      ))}
                    </div>
                    <div className="feedback-block">
                      <h3>잘한 점</h3>
                      <ul>
                        {draft.evaluation.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <h3>보완할 점</h3>
                      <ul>
                        {draft.evaluation.weaknesses.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <h3>다시 쓰기 목표</h3>
                      <p>{draft.evaluation.rewrite_goal}</p>
                      <h3>생각을 여는 질문</h3>
                      <p>{draft.evaluation.guiding_question}</p>
                      <h3>작성 시간</h3>
                      <p>{draft.evaluation.time_feedback}</p>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title={
                      draft.attempt.submitted_at
                        ? "AI 피드백을 기다리고 있어요."
                        : "제출 후 피드백을 확인하세요."
                    }
                  >
                    답안은 먼저 안전하게 저장되며, AI 오류가 나도 작성 내용은
                    사라지지 않습니다.
                  </EmptyState>
                )}
              </Card>
            </div>
          </>
        )
      )}
      {history.length > 0 && (
        <section className="page-section">
          <div className="section-heading">
            <h2>History & Growth</h2>
            <span className="caption">최근 {history.length}개 기록</span>
          </div>
          <div className="history-list page-section">
            {history.map((item) => (
              <Link href={`/essay?attempt=${item.attempt_id}`} key={item.id}>
                <span>Rewrite {item.version}</span>
                <strong>
                  {item.essay_attempts?.practice_type
                    ? practiceLabels[
                        item.essay_attempts
                          .practice_type as keyof typeof practiceLabels
                      ]
                    : "논술 연습"}
                </strong>
                <span>
                  {item.essay_evaluations
                    ? `${item.essay_evaluations.total_score}점`
                    : item.evaluation_state === "failed"
                      ? "평가 재시도 필요"
                      : "작성 중"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
