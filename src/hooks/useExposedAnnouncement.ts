import { useEffect, useRef, useState } from "react";

const HIDDEN_ANCESTOR_SELECTOR = '[aria-hidden="true"]';

function isExposed(element: HTMLElement | null): boolean {
  return element !== null && element.closest(HIDDEN_ANCESTOR_SELECTOR) === null;
}

export function useExposedAnnouncement(message: string) {
  const ref = useRef<HTMLElement>(null);
  const [exposed, setExposed] = useState(false);
  const pending = message !== "";

  useEffect(() => {
    if (!pending) return;
    const syncExposure = () => setExposed(isExposed(ref.current));
    syncExposure();
    const observer = new MutationObserver(syncExposure);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-hidden"],
      subtree: true,
    });
    return () => observer.disconnect();
  }, [pending]);

  return { ref, message: pending && exposed ? message : "" };
}
