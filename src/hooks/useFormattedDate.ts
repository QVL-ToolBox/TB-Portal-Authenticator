import { useTranslation } from "@canop/ui";
import { toDateLocale } from "../i18n/toDateLocale";

export function useFormattedDate(isoDate: string): string {
  const { locale } = useTranslation();
  return new Date(isoDate).toLocaleDateString(toDateLocale(locale));
}
