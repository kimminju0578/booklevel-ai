"use client";

import { useEffect, useRef } from "react";

export function useOnMount(work: () => void | Promise<void>) {
  const workRef = useRef(work);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void workRef.current();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
}
