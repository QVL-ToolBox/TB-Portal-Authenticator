import { LiveRegion, Stack } from "@canop/ui";
import type { AdminToastMessage } from "../hooks/useAdminToast";
import { useExposedAnnouncement } from "../hooks/useExposedAnnouncement";

export interface AdminErrorAnnouncementProps {
  toast: AdminToastMessage | null;
}

export function AdminErrorAnnouncement({ toast }: AdminErrorAnnouncementProps) {
  const errorMessage = toast?.severity === "error" ? toast.message : "";
  const { ref, message } = useExposedAnnouncement(errorMessage);

  return (
    <Stack ref={ref}>
      <LiveRegion message={message} politeness="assertive" announcementId={toast?.id} />
    </Stack>
  );
}
