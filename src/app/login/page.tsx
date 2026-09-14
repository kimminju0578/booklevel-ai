import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { Brand } from "@/components/ui/site-shell";

export const metadata: Metadata = { title: "로그인 · BOOKLEVEL", robots: { index: false, follow: false } };
export default function LoginPage() { return <main className="auth-page"><div className="auth-brand"><Brand /></div><div className="auth-heading"><p className="eyebrow">WELCOME BACK</p><h1>다시, 읽는 나로</h1><p>나의 진단과 책장을 이어서 만나보세요.</p></div><AuthForm mode="login" /><p className="auth-switch">아직 계정이 없나요? <Link href="/signup">회원가입</Link></p></main>; }
