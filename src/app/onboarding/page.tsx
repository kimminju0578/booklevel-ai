import type { Metadata } from "next";
import { Brand } from "@/components/ui/site-shell";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
export const metadata: Metadata = { title: "관심 분야 선택 · BOOKLEVEL", robots: { index: false, follow: false } };
export default function OnboardingPage() { return <main className="auth-page onboarding-page"><div className="auth-brand"><Brand /></div><div className="auth-heading"><p className="eyebrow">YOUR READING MAP</p><h1>무엇이 가장 궁금한가요?</h1><p>관심 분야를 바탕으로 진단과 다음 책을 준비할게요.</p></div><OnboardingForm /></main>; }
