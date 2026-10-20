import { useState } from "react";
import type { AdminToastMessage } from "./useAdminToast";

interface ToastLayer {
  id: number;
  inPanel: boolean;
}

export function useToastLayer(toast: AdminToastMessage | null, panelOpen: boolean): boolean {
  const [layer, setLayer] = useState<ToastLayer | null>(null);
  if (toast === null) return false;
  if (layer?.id === toast.id) return layer.inPanel;
  setLayer({ id: toast.id, inPanel: panelOpen });
  return panelOpen;
}
