"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import { Button, Card } from "@/components/ui/primitives";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await api<{ needsConfirmation?: boolean }>(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify({ email, password, displayName: displayName || undefined }) });
      if (result.needsConfirmation) { setError("가입 확인 메일을 보냈습니다. 메일의 링크를 눌러 로그인해주세요."); return; }
      router.push(mode === "signup" ? "/onboarding" : "/home"); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "요청을 처리하지 못했습니다."); }
    finally { setBusy(false); }
  }
  return <Card className="auth-card">
    <form onSubmit={submit} className="form-stack">
      {mode === "signup" && <label>이름<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={1} maxLength={30} placeholder="어떻게 불러드릴까요?" required /></label>}
      <label>이메일<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
      <label>비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} maxLength={128} required /><span className="field-help">8자 이상</span></label>
      {error && <p className="error-message" role="alert">{error}</p>}
      <Button type="submit" className="full-width" disabled={busy}>{busy ? "처리 중…" : mode === "signup" ? "무료로 시작하기" : "로그인"}</Button>
    </form>
  </Card>;
}
