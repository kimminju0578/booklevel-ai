"use client";
import { useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { Button } from "@/components/ui/primitives";
export function ReportButton({
  targetType,
  targetId,
}: {
  targetType:
    | "review"
    | "review_comment"
    | "discussion"
    | "discussion_post"
    | "essay";
  targetId: string;
}) {
  const [message, setMessage] = useState("");
  async function report() {
    if (!window.confirm("이 콘텐츠를 운영팀에 신고할까요?")) return;
    try {
      await api("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType,
          targetId,
          reason: "other",
          details: "사용자 신고",
        }),
      });
      setMessage("신고를 접수했습니다.");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "신고를 접수하지 못했습니다.",
      );
    }
  }
  return (
    <>
      <Button variant="quiet" className="button-small" onClick={report}>
        신고
      </Button>
      {message && (
        <span className="caption" role="status">
          {message}
        </span>
      )}
    </>
  );
}
