import { PageScaffold } from "@canop/ui";
import type { PortalLayoutProps } from "../config/authPortalConfig";
import { useAdminLayout } from "../hooks/useAdminLayout";

export function AdminLayout({ children }: PortalLayoutProps) {
  const layout = useAdminLayout();

  return (
    <PageScaffold {...layout} mobileFooterPlacement="settings">
      {children}
    </PageScaffold>
  );
}
