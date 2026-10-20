import type { CanopLocale, CanopLocaleMessages, CanopMessages } from "@canop/ui";
import { authPortalMessages } from "./authPortalMessages";

export function mergeAuthPortalMessages(
  overrides: CanopLocaleMessages = {},
): Record<CanopLocale, CanopMessages> {
  return {
    fr: { ...authPortalMessages.fr, ...overrides.fr },
    en: { ...authPortalMessages.en, ...overrides.en },
  };
}
