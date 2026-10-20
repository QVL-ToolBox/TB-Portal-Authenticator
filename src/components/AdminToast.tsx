import { Toast } from "@canop/ui";
import type { AdminToastMessage } from "../hooks/useAdminToast";
import { AdminErrorAnnouncement } from "./AdminErrorAnnouncement";

export interface AdminToastProps {
  toast: AdminToastMessage | null;
  onClose: () => void;
  announce?: boolean;
}

export function AdminToast({ toast, onClose, announce = true }: AdminToastProps) {
  return (
    <>
      <Toast
        open={toast !== null}
        message={toast?.message ?? ""}
        severity={toast?.severity}
        onClose={onClose}
      />
      <AdminErrorAnnouncement toast={announce ? toast : null} />
    </>
  );
}
