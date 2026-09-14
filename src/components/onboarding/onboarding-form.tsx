"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import { Button, Card } from "@/components/ui/primitives";

type Category = { id: string; slug: string; name: string };
export function OnboardingForm() {
  const router = useRouter(); const [categories, setCategories] = useState<Category[]>([]); const [selected, setSelected] = useState<string[]>([]); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { api<{ categories: Category[] }>("/api/categories").then((data) => setCategories(data.categories)).catch((caught) => setError(caught instanceof Error ? caught.message : "분야를 불러오지 못했습니다.")); }, []);
  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current); }
  async function save() { setBusy(true); setError(""); try { await api("/api/profile/interests", { method: "PUT", body: JSON.stringify({ categoryIds: selected }) }); router.push(`/assessment/${categories.find((category) => category.id === selected[0])?.slug ?? "economics"}`); } catch (caught) { setError(caught instanceof Error ? caught.message : "관심 분야를 저장하지 못했습니다."); } finally { setBusy(false); } }
  return <Card className="onboarding-card"><p className="reading-copy">최대 3개까지 골라주세요. 1순위부터 지금 가장 궁금한 분야를 선택하면 돼요.</p><div className="interest-grid">{categories.map((category) => <button className="interest" aria-pressed={selected.includes(category.id)} key={category.id} onClick={() => toggle(category.id)} type="button"><span>{category.name}</span><span>{selected.indexOf(category.id) >= 0 ? `${selected.indexOf(category.id) + 1}순위` : "＋"}</span></button>)}</div>{!categories.length && !error && <p className="loading-line">관심 분야를 불러오는 중…</p>}{error && <p className="error-message" role="alert">{error}</p>}<Button className="full-width" disabled={selected.length === 0 || busy} onClick={save}>{busy ? "저장 중…" : `${selected.length}개 분야로 시작하기`}</Button></Card>;
}
