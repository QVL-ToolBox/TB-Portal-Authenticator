import { navigateTo } from "@canop/ui";
import { useCallback, useEffect, useRef } from "react";

export function useLoginRedirect(loginUrl: () => string): () => void {
  const redirecting = useRef(false);

  useEffect(() => {
    const allowAfterBackNavigation = (event: PageTransitionEvent) => {
      if (event.persisted) redirecting.current = false;
    };
    window.addEventListener("pageshow", allowAfterBackNavigation);
    return () => window.removeEventListener("pageshow", allowAfterBackNavigation);
  }, []);

  return useCallback(() => {
    if (redirecting.current) return;
    redirecting.current = true;
    navigateTo(loginUrl());
  }, [loginUrl]);
}
