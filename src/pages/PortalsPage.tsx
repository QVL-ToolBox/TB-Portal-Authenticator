import { PresenceItem, useTranslation } from "@canop/ui";
import { AdminCardGrid } from "../components/AdminCardGrid";
import { AdminPageContent } from "../components/AdminPageContent";
import { PortalCard } from "../components/PortalCard";
import { usePortalsPage } from "../hooks/usePortalsPage";

export function PortalsPage() {
  const { t } = useTranslation();
  const { items, loading, errors, isEmpty } = usePortalsPage();

  return (
    <AdminPageContent title={t("auth.admin.portals.title")} errors={errors}>
      <AdminCardGrid loading={loading} isEmpty={isEmpty} emptyTitle={t("auth.admin.portals.empty")}>
        {items.map(({ portal, label }) => (
          <PresenceItem key={portal.name} fill>
            <PortalCard portal={portal} label={label} />
          </PresenceItem>
        ))}
      </AdminCardGrid>
    </AdminPageContent>
  );
}
