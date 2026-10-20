import { useState } from "react";
import { useAuthPortal } from "../config/AuthPortalContext";

export function useForgotPassword() {
  const { api } = useAuthPortal();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await api.forgotPassword(email).catch(() => undefined);
    setSent(true);
    setLoading(false);
  }

  return { email, setEmail, sent, loading, submit };
}
