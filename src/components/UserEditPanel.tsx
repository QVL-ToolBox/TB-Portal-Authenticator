import {
  DeleteButton,
  Divider,
  IconActionButton,
  SidePanel,
  Stack,
  useTranslation,
} from "@canop/ui";
import type { AdminToastMessage } from "../hooks/useAdminToast";
import type { PortalRoleGroup } from "../hooks/usePortalRoleGroups";
import type { UserEditor } from "../hooks/useUserEditor";
import { AdminErrorAnnouncement } from "./AdminErrorAnnouncement";
import { UserDevicesSection } from "./UserDevicesSection";
import { UserIdentityFields } from "./UserIdentityFields";
import { UserRolesEditor } from "./UserRolesEditor";
import { UserStatusLine } from "./UserStatusLine";

export interface UserEditPanelProps {
  editor: UserEditor;
  groups: readonly PortalRoleGroup[];
  toast?: AdminToastMessage | null;
}

export function UserEditPanel({ editor, groups, toast = null }: UserEditPanelProps) {
  const { t } = useTranslation();
  const userName = editor.editing?.name ?? "";

  return (
    <SidePanel
      open={editor.open}
      onClose={editor.close}
      title={t("auth.admin.users.editTitle")}
      actions={
        <>
          <IconActionButton
            icon="save"
            ariaLabel={t("auth.admin.save")}
            onClick={() => void editor.submit()}
            disabled={editor.busy}
            loading={editor.busy}
          />
          <DeleteButton
            ariaLabel={t("auth.admin.users.action.delete")}
            confirmTitle={t("auth.admin.users.deleteTitle", { name: userName })}
            confirmMessage={t("auth.admin.users.deleteMessage")}
            confirmLabel={t("auth.admin.confirm")}
            cancelLabel={t("auth.admin.cancel")}
            disabled={editor.busy}
            onConfirm={editor.deleteUser}
          />
        </>
      }
    >
      <AdminErrorAnnouncement toast={toast} />
      {editor.editing && (
        <Stack gap="lg">
          <UserStatusLine status={editor.editing.status} />
          <Stack as="form" gap="md" onSubmit={editor.submitForm}>
            <UserIdentityFields editor={editor} />
            <UserRolesEditor
              groups={groups}
              roles={editor.roles}
              onToggleRole={editor.toggleRole}
            />
          </Stack>
          <Divider spacing="none" />
          <UserDevicesSection editor={editor} />
        </Stack>
      )}
    </SidePanel>
  );
}
