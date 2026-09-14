import type { Metadata } from "next";
import { Brand } from "@/components/ui/site-shell";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { DemoPage } from "@/components/demo/demo-page";
import { configured } from "@/lib/server/env";
export const metadata: Metadata = { title: "관심 분야 선택 · BOOKLEVEL", robots: { index: false, follow: false } };
export default function OnboardingPage() { return configured() ? <main className="auth-page onboarding-page"><div className="auth-brand"><Brand /></div><div className="auth-heading"><p className="eyebrow">YOUR READING MAP</p><h1>무엇이 가장 궁금한가요?</h1><p>관심 분야를 바탕으로 진단과 다음 책을 준비할게요.</p></div><OnboardingForm /></main> : <main className="shell app-page"><DemoPage title="관심 분야를 골라보세요." description="회원가입과 관심 분야 저장은 Supabase 연결 후 활성화됩니다. 데모에서는 추천 도서와 OpenAI 독서 코치를 바로 체험할 수 있어요." /></main>; }
