import { useTranslation } from "@canop/ui";
import { AdminPageContent } from "../components/AdminPageContent";
import { AdminToast } from "../components/AdminToast";
import { UserEditPanel } from "../components/UserEditPanel";
import { UsersTable } from "../components/UsersTable";
import { useUsersPage } from "../hooks/useUsersPage";

export function UsersPage() {
  const { t } = useTranslation();
  const {
    users,
    loading,
    errors,
    groups,
    editor,
    portalAccessLabel,
    toggleActive,
    toast,
    toastInPanel,
    closeToast,
  } = useUsersPage();

  return (
    <AdminPageContent title={t("auth.admin.users.title")} errors={errors} fillHeight>
      <UsersTable
        users={users}
        loading={loading}
        portalAccessLabel={portalAccessLabel}
        onToggleActive={toggleActive}
        onEdit={editor.start}
      />
      <UserEditPanel editor={editor} groups={groups} toast={toastInPanel ? toast : null} />
      <AdminToast toast={toast} onClose={closeToast} announce={!toastInPanel} />
    </AdminPageContent>
  );
}
