import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({ src: "../../public/PretendardVariable.woff2", variable: "--font-pretendard", display: "swap", weight: "100 900" });

export const metadata: Metadata = {
  title: "BOOKLEVEL AI — 지금의 나에게 필요한 책",
  description: "현재 지식 수준을 진단하고 다음에 읽을 책을 발견하세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full"><a className="skip-link" href="#main-content">본문으로 바로가기</a>{children}</body>
    </html>
  );
}
