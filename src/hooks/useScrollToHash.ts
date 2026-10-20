import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function useScrollToHash() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const element = document.getElementById(hash.slice(1));
    if (!element) return;
    const prefersReducedMotion = window.matchMedia?.(REDUCED_MOTION_QUERY).matches;
    element.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }, [hash]);
}
