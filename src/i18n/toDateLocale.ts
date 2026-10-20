import type { CanopLocale } from "@canop/ui";

const DATE_LOCALES: Record<CanopLocale, string> = {
  fr: "fr-FR",
  en: "en-GB",
};

export function toDateLocale(locale: CanopLocale): string {
  return DATE_LOCALES[locale];
}
