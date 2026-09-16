"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
import { calculateTasteProfile } from "@/lib/taste/scoring";
import { tasteDimensions, tasteQuestionVersion } from "@/lib/taste/config";
import {
  decodeTastePayload,
  tasteResultSvg,
  tasteShareUrl,
} from "@/lib/taste/share";
const storageKey = `booklevel:taste:${tasteQuestionVersion}`;
type TasteBook = {
  book: {
    id: string;
    title: string;
    authors: string[];
    cover_url: string | null;
    description: string | null;
  };
  tasteMatch: number;
};
const characterPosition: Record<string, string> = {
  reflective_explorer: "0% 0%",
  knowledge_seeker: "33.333% 0%",
  realist_analyst: "66.666% 0%",
  emotional_immersive: "100% 0%",
  story_collector: "0% 100%",
  intellectual_adventurer: "33.333% 100%",
  deep_reader: "66.666% 100%",
  perspective_connector: "100% 100%",
};
export function TasteResult() {
  const [profile, setProfile] = useState<ReturnType<
    typeof calculateTasteProfile
  > | null>(null);
  const [books, setBooks] = useState<TasteBook[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error" | "empty">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const saved = JSON.parse(
          localStorage.getItem(storageKey) || "null",
        ) as { answers?: Record<string, number> } | null;
        const shared = searchParams.get("data");
        const answers = shared
          ? decodeTastePayload(shared).answers
          : saved?.answers;
        if (!answers) {
          setState("empty");
          return;
        }
        const calculated = calculateTasteProfile(answers);
        if (active) setProfile(calculated);
        const result = await api<{ books: TasteBook[]; warning?: string }>(
          "/api/taste/recommendations",
          {
            method: "POST",
            body: JSON.stringify({ version: tasteQuestionVersion, answers }),
          },
        );
        if (active) {
          setBooks(result.books);
          setMessage(result.warning || "");
          setState("ready");
        }
      } catch (caught) {
        if (active) {
          setMessage(
            caught instanceof ClientApiError
              ? caught.message
              : "추천 도서를 불러오지 못했습니다.",
          );
          setState("error");
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [searchParams]);
  async function share() {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as {
      answers?: Record<string, number>;
    } | null;
    const url = saved?.answers
      ? tasteShareUrl(window.location.origin, saved.answers)
      : window.location.href;
    if (navigator.share)
      await navigator.share({
        title: "나의 BOOKLEVEL 독서 취향",
        text: profile?.archetype.name,
        url,
      });
    else {
      await navigator.clipboard.writeText(url);
      setMessage("결과 링크를 복사했습니다.");
    }
  }
  async function downloadImage() {
    if (!profile) return;
    const svg = tasteResultSvg(profile);
    const fallback = () => {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "booklevel-reading-taste.svg";
      link.click();
      URL.revokeObjectURL(url);
    };
    try {
      const image = new window.Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("image"));
      });
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 600;
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("canvas");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "booklevel-reading-taste.png";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      fallback();
      setMessage("PNG 저장을 지원하지 않아 SVG 이미지로 저장했습니다.");
    }
  }
  function retake() {
    localStorage.removeItem(storageKey);
    router.push("/taste/test");
  }
  if (state === "loading")
    return (
      <Card>
        <p className="reading-copy">당신의 독서 취향을 정리하고 있어요…</p>
      </Card>
    );
  if (state === "empty")
    return (
      <Card>
        <EmptyState
          title="먼저 취향 테스트를 완료해주세요."
          action={
            <Link className="button button--primary" href="/taste/test">
              테스트 시작
            </Link>
          }
        >
          12개의 질문에 답하면 나만의 독서 취향을 확인할 수 있어요.
        </EmptyState>
      </Card>
    );
  if (!profile)
    return (
      <Card>
        <EmptyState
          title="결과를 불러오지 못했어요."
          action={
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              다시 시도
            </Button>
          }
        >
          {message}
        </EmptyState>
      </Card>
    );
  return (
    <div className="taste-result">
      <Card variant="soft" tone="sage" className="taste-hero-result">
        <div
          className="taste-character"
          role="img"
          aria-label={`${profile.archetype.name} 캐릭터`}
          style={{
            backgroundPosition: characterPosition[profile.archetype.key] || "0% 0%",
          }}
        />
        <p className="eyebrow">YOUR READING TASTE</p>
        <p className="taste-result-label">당신은</p>
        <h2>{profile.archetype.name}</h2>
        <p className="reading-copy">{profile.archetype.shortDescription}</p>
        <div className="taste-keywords">
          {profile.archetype.keywords.map((keyword) => (
            <span key={keyword}>{keyword}</span>
          ))}
        </div>
        <div className="button-row">
          <Button variant="secondary" onClick={() => void share()}>
            공유하기
          </Button>
          <Button variant="quiet" onClick={() => void downloadImage()}>
            결과 이미지 저장
          </Button>
        </div>
      </Card>
      <Card>
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR READING PATTERN</p>
            <h2>당신의 독서 취향</h2>
          </div>
          <button className="text-link" type="button" onClick={retake}>
            다시 테스트 ↗
          </button>
        </div>
        <div className="taste-dimensions">
          {tasteDimensions.map((dimension) => (
            <div className="taste-dimension" key={dimension}>
              <div>
                <span>{dimensionLabel[dimension]}</span>
                <strong>{profile.dimensions[dimension]}</strong>
              </div>
              <div className="progress-track">
                <span
                  className="progress-fill"
                  style={{ width: `${profile.dimensions[dimension]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="caption">{profile.archetype.recommendedReadingStyle}</p>
      </Card>
      <Card>
        <p className="eyebrow">BOOKS FOR YOUR TASTE</p>
        <h2>당신의 취향과 잘 맞는 책</h2>
        {state === "error" ? (
          <EmptyState title="추천 도서를 불러오지 못했어요.">
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              추천 다시 시도
            </Button>
          </EmptyState>
        ) : books.length ? (
          <div className="taste-book-list">
            {books.map((item) => (
              <article className="taste-book" key={item.book.id}>
                <div className="taste-book-cover">
                  {item.book.cover_url ? (
                    <Image
                      src={item.book.cover_url}
                      alt=""
                      width={72}
                      height={108}
                      unoptimized
                    />
                  ) : (
                    <span>{item.book.title}</span>
                  )}
                </div>
                <div>
                  <h3>
                    <Link href={`/books/${item.book.id}`}>
                      {item.book.title}
                    </Link>
                  </h3>
                  <p className="author">{item.book.authors.join(", ")}</p>
                  <p className="caption">
                    취향 적합도 {Math.round(item.tasteMatch * 100)}%
                  </p>
                  <p className="reading-copy">
                    {item.book.description ||
                      "검증된 도서 정보를 바탕으로 골라보세요."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="아직 취향 정보가 있는 책이 없어요.">
            {message ||
              "실제 도서의 취향 메타데이터가 준비되면 추천이 표시됩니다."}
          </EmptyState>
        )}
        {message && state === "ready" && (
          <p className="notice-message">{message}</p>
        )}
      </Card>
    </div>
  );
}
const dimensionLabel = {
  pace: "느린 전개 선호",
  ambiguity: "열린 해석",
  realism: "현실 기반",
  emotionality: "감정 몰입",
  intellectual_depth: "깊은 사고",
  practical_vs_conceptual: "개념적 관점",
  breadth_vs_depth: "한 분야 심화",
  plot_vs_character: "인물·심리 중심",
} as const;
