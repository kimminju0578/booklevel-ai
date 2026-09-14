import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { Brand } from "@/components/ui/site-shell";

export const metadata: Metadata = { title: "회원가입 · BOOKLEVEL", robots: { index: false, follow: false } };
export default function SignupPage() { return <main className="auth-page"><div className="auth-brand"><Brand /></div><div className="auth-heading"><p className="eyebrow">START YOUR READING MAP</p><h1>읽는 만큼, 나를 알아가는 시작</h1><p>관심 분야를 고르고 지금의 북레벨을 발견해보세요.</p></div><AuthForm mode="signup" /><p className="auth-switch">이미 계정이 있나요? <Link href="/login">로그인</Link></p></main>; }
