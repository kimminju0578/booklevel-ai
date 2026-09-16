"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import { Button } from "@/components/ui/primitives";
export function SessionAction() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useOnMount(async () => {
    try {
      const result = await api<{ profile: { avatar_url: string | null } }>("/api/profile");
      setAvatarUrl(result.profile.avatar_url);
      setSignedIn(true);
    } catch {
      setSignedIn(false);
    }
  });
  async function logout() {
    await api("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    setAvatarUrl(null);
    setSignedIn(false);
    router.push("/");
    router.refresh();
  }
  return signedIn ? (
    <div className="session-actions">
      <Link className="profile-nav-link" href="/profile" aria-label="프로필 보기">
        <span className="header-avatar">
          {avatarUrl ? <Image src={avatarUrl} alt="" width={32} height={32} unoptimized /> : <span aria-hidden="true">📚</span>}
        </span>
        <span>프로필</span>
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
