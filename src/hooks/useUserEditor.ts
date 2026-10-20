import { useCallback, useState, type FormEvent } from "react";
import type { AdminUser, AdminUserDevice } from "../api/adminApi";
import type { UsersResource } from "./useUsers";

export type UserEditorActions = Pick<
  UsersResource,
  | "editUser"
  | "assignRoles"
  | "changePassword"
  | "updateWhitelist"
  | "revokeDevice"
  | "remove"
  | "notifyUpdated"
  | "notifyUnsaved"
  | "reload"
>;

function toggled(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function sameRoles(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((role) => right.includes(role));
}

export function useUserEditor(actions: UserEditorActions) {
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [whitelistOnly, setWhitelistOnlyState] = useState(false);
  const [devices, setDevices] = useState<AdminUserDevice[]>([]);
  const [busy, setBusy] = useState(false);

  const start = useCallback((user: AdminUser) => {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRoles([...user.roles]);
    setWhitelistOnlyState(user.whitelist_only);
    setDevices([...user.devices]);
  }, []);

  function close() {
    actions.notifyUnsaved();
    setEditing(null);
  }

  function toggleRole(roleName: string) {
    setRoles((current) => toggled(current, roleName));
  }

  async function setWhitelistOnly(enabled: boolean) {
    if (!editing) return;
    if (await actions.updateWhitelist(editing.user_id, enabled)) setWhitelistOnlyState(enabled);
  }

  async function revokeDevice(deviceId: string) {
    if (!editing) return;
    if (await actions.revokeDevice(editing.user_id, deviceId)) {
      setDevices((current) => current.filter((device) => device.id !== deviceId));
    }
  }

  async function saveChanges(user: AdminUser): Promise<boolean> {
    const profileChanged = name !== user.name || email !== user.email;
    if (profileChanged && !(await actions.editUser(user.user_id, { name: name.trim(), email }))) {
      return false;
    }
    const rolesChanged = !sameRoles(roles, user.roles);
    if (rolesChanged && !(await actions.assignRoles(user.user_id, roles))) return false;
    if (password.trim() === "") return true;
    return actions.changePassword(user.user_id, password);
  }

  async function submit() {
    if (!editing) return;
    setBusy(true);
    const saved = await saveChanges(editing);
    actions.reload();
    setBusy(false);
    if (!saved) return;
    actions.notifyUpdated(name.trim());
    setEditing(null);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  async function deleteUser() {
    if (!editing) return;
    if (await actions.remove(editing)) setEditing(null);
  }

  return {
    editing,
    open: editing !== null,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    roles,
    toggleRole,
    whitelistOnly,
    setWhitelistOnly,
    canToggleWhitelist: whitelistOnly || devices.length > 0,
    showWhitelistHint: !whitelistOnly && devices.length === 0,
    devices,
    canRevokeDevice: !whitelistOnly || devices.length > 1,
    revokeDevice,
    busy,
    start,
    close,
    submit,
    submitForm,
    deleteUser,
  };
}

export type UserEditor = ReturnType<typeof useUserEditor>;
