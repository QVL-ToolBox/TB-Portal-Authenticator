import type { CanopToastSeverity } from "@canop/ui";
import { useCallback, useRef, useState } from "react";

export interface AdminToastMessage {
  severity: CanopToastSeverity;
  message: string;
  id: number;
}

export type AdminNotifier = (severity: CanopToastSeverity, message: string) => void;

export function useAdminToast() {
  const [toast, setToast] = useState<AdminToastMessage | null>(null);
  const lastId = useRef(0);
  const notify = useCallback<AdminNotifier>((severity, message) => {
    lastId.current += 1;
    setToast({ severity, message, id: lastId.current });
  }, []);
  const closeToast = useCallback(() => setToast(null), []);

  return { toast, notify, closeToast };
}
