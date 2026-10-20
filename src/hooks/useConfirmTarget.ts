import { useState } from "react";

export function useConfirmTarget<T>(onConfirm: (target: T) => Promise<unknown>) {
  const [target, setTarget] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (target === null) return;
    setBusy(true);
    try {
      await onConfirm(target);
    } finally {
      setBusy(false);
      setTarget(null);
    }
  }

  return {
    target,
    busy,
    open: target !== null,
    request: (item: T) => setTarget(item),
    cancel: () => setTarget(null),
    confirm,
  };
}
