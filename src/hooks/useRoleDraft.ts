import { useState, type FormEvent } from "react";
import type { CreateRolePayload } from "../api/adminApi";

export function useRoleDraft(create: (payload: CreateRolePayload) => Promise<boolean>) {
  const [portal, setPortal] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const trimmedName = name.trim();

  function start(portalName: string) {
    setPortal(portalName);
    setName("");
  }

  function cancel() {
    setPortal(null);
    setName("");
  }

  async function save() {
    if (!portal || trimmedName === "") return;
    setSaving(true);
    const created = await create({ name: trimmedName, portal });
    setSaving(false);
    if (created) cancel();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save();
  }

  return {
    portal,
    name,
    setName,
    saving,
    canSave: trimmedName !== "" && !saving,
    start,
    cancel,
    save,
    submit,
  };
}

export type RoleDraft = ReturnType<typeof useRoleDraft>;
