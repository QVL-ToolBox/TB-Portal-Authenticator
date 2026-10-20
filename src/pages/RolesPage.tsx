import { ConfirmDialog, PresenceItem, useTranslation } from "@canop/ui";
import { AdminCardGrid } from "../components/AdminCardGrid";
import { AdminPageContent } from "../components/AdminPageContent";
import { AdminToast } from "../components/AdminToast";
import { PortalRolesCard } from "../components/PortalRolesCard";
import { useRolesPage } from "../hooks/useRolesPage";

export function RolesPage() {
  const { t } = useTranslation();
  const {
    groups,
    portalsLoading,
    rolesLoading,
    isEmpty,
    errors,
    draft,
    deletion,
    toast,
    closeToast,
  } = useRolesPage();

  return (
    <AdminPageContent title={t("auth.admin.roles.title")} errors={errors}>
      <AdminCardGrid
        loading={portalsLoading}
        isEmpty={isEmpty}
        emptyTitle={t("auth.admin.portals.empty")}
      >
        {groups.map((group) => (
          <PresenceItem key={group.portal.name} fill>
            <PortalRolesCard
              group={group}
              rolesLoading={rolesLoading}
              draft={draft}
              onDelete={deletion.request}
            />
          </PresenceItem>
        ))}
      </AdminCardGrid>

      <ConfirmDialog
        open={deletion.open}
        title={t("auth.admin.roles.deleteTitle")}
        message={t("auth.admin.roles.deleteMessage", { name: deletion.target?.name ?? "" })}
        confirmLabel={t("auth.admin.confirm")}
        cancelLabel={t("auth.admin.cancel")}
        destructive
        loading={deletion.busy}
        onConfirm={() => void deletion.confirm()}
        onCancel={deletion.cancel}
      />

      <AdminToast toast={toast} onClose={closeToast} />
    </AdminPageContent>
  );
}
