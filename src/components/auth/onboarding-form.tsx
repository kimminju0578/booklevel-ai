"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import { Button, Card, EmptyState } from "@/components/ui/primitives";

type Category = { id: string; slug: string; name: string };

export function OnboardingForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error" | "saving">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const load = async () => {
    setState("loading");
    try {
      const data = await api<{ categories: Category[] }>("/api/categories");
      setCategories(data.categories);
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "분야를 불러오지 못했습니다.",
      );
      setState("error");
    }
  };
  useOnMount(load);
  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );
  }
  async function save() {
    setState("saving");
    setMessage("");
    try {
      await api("/api/profile/interests", {
        method: "PUT",
        body: JSON.stringify({ categoryIds: selected }),
      });
      const first = categories.find((category) => category.id === selected[0]);
      router.push(first ? `/assessment/${first.slug}` : "/home");
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "관심 분야를 저장하지 못했습니다.",
      );
      setState("ready");
    }
  }
  if (state === "loading")
    return (
      <div className="skeleton-panel" aria-label="관심 분야 불러오는 중" />
    );
  if (state === "error")
    return (
      <Card>
        <EmptyState
          title="관심 분야를 불러오지 못했어요."
          action={
            <Button onClick={load} variant="secondary">
              다시 시도
            </Button>
          }
        >
          {message}
        </EmptyState>
      </Card>
    );
  return (
    <Card>
      <fieldset className="interest-fieldset">
        <legend>관심 분야를 1~3개 선택해주세요.</legend>
        <p className="caption">선택한 순서대로 추천 우선순위가 정해집니다.</p>
        <div className="interest-grid">
          {categories.map((category) => (
            <button
              type="button"
              className="interest"
              key={category.id}
              aria-pressed={selected.includes(category.id)}
              onClick={() => toggle(category.id)}
            >
              <span>{category.name}</span>
              <span aria-hidden="true">
                {selected.includes(category.id)
                  ? selected.indexOf(category.id) + 1
                  : "＋"}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      {message && (
        <p className="error-message" role="alert">
          {message}
        </p>
      )}
      <Button
        onClick={save}
        disabled={selected.length === 0 || state === "saving"}
        className="full-width"
      >
        {state === "saving" ? "저장 중…" : "이 관심사로 시작하기"}
      </Button>
    </Card>
  );
}
