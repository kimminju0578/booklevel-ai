import Link from "next/link";
import type { ReactNode } from "react";
import { SessionAction } from "@/components/auth/session-action";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="BOOKLEVEL AI 시작 페이지">
      <span className="brand-mark" aria-hidden="true">
        b.
      </span>
      <span>
        booklevel<span className="brand-ai">AI</span>
      </span>
    </Link>
  );
}

export function SiteHeader({
  active = "발견",
  action,
}: {
  active?: string;
  action?: ReactNode;
}) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand />
        <nav className="main-nav" aria-label="주 메뉴">
          {[
            ["/", "발견"],
            ["/home", "나의 홈"],
            ["/recommendations", "추천"],
            ["/search", "책 찾기"],
            ["/community", "커뮤니티"],
            ["/essay", "논술"],
            ["/library", "내 서재"],
            ["/ranking", "성장"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={active === label ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-action">{action ?? <SessionAction />}</div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="shell footer">
      <Brand />
      <p>읽고, 생각하고, 조금 더 넓어지는 나.</p>
      <small>© 2026 BOOKLEVEL AI</small>
    </footer>
  );
}

export function PageShell({
  children,
  active,
  eyebrow,
  title,
  description,
}: {
  children: ReactNode;
  active?: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <SiteHeader active={active} />
      <main id="main-content" className="shell app-page">
        <div className="page-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </main>
      <SiteFooter />
      <nav className="mobile-bottom-nav" aria-label="모바일 메뉴">
        {[
          ["/home", "홈"],
          ["/search", "검색"],
          ["/recommendations", "추천"],
          ["/essay", "논술"],
          ["/library", "서재"],
        ].map(([href, label]) => (
          <Link href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
