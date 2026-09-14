"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import { Button } from "@/components/ui/primitives";
export function SessionAction() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  useOnMount(async () => {
    try {
      await api("/api/profile");
      setSignedIn(true);
    } catch {
      setSignedIn(false);
    }
  });
  async function logout() {
    await api("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    setSignedIn(false);
    router.push("/");
    router.refresh();
  }
  return signedIn ? (
    <div className="session-actions">
      <Link className="button button--secondary button-small" href="/profile">
        프로필
      </Link>
      <Button
        variant="quiet"
        className="button-small logout-button"
        onClick={logout}
      >
        로그아웃
      </Button>
    </div>
  ) : (
    <Link className="button button--secondary button-small" href="/login">
      로그인 <span aria-hidden="true">↗</span>
    </Link>
  );
}
