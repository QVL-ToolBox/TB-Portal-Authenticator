import { useEffect, useState } from "react";
import { useAuthPortal } from "../config/AuthPortalContext";

export function useRegistrationEnabled(): boolean | null {
  const { api } = useAuthPortal();
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getRegistrationEnabled()
      .then((setting) => {
        if (active) setRegistrationEnabled(setting.enabled);
      })
      .catch(() => {
        if (active) setRegistrationEnabled(true);
      });
    return () => {
      active = false;
    };
  }, [api]);

  return registrationEnabled;
}
