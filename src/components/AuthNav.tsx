import { Stack, useTranslation } from "@canop/ui";
import { AppLink } from "./AppLink";

export interface AuthNavItem {
  to: string;
  label: string;
}

export interface AuthNavProps {
  links: readonly AuthNavItem[];
}

export function AuthNav({ links }: AuthNavProps) {
  const { t } = useTranslation();

  return (
    <Stack as="nav" gap="xs" ariaLabel={t("auth.nav.label")}>
      {links.map((link) => (
        <AppLink key={link.to} to={link.to}>
          {link.label}
        </AppLink>
      ))}
    </Stack>
  );
}
