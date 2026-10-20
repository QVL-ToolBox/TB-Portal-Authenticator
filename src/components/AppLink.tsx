import { Link } from "@canop/ui";
import type { ReactNode } from "react";
import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router-dom";

export interface AppLinkProps {
  to: string;
  children: ReactNode;
  newTab?: boolean;
  subtitle?: boolean;
}

function NewTabRouterLink(props: RouterLinkProps) {
  return <RouterLink {...props} target="_blank" rel="noopener noreferrer" />;
}

export function AppLink({ to, children, newTab = false, subtitle = false }: AppLinkProps) {
  return (
    <Link
      component={newTab ? NewTabRouterLink : RouterLink}
      to={to}
      size={subtitle ? "xsmall" : "small"}
      color="primary"
      noWrap={subtitle}
    >
      {children}
    </Link>
  );
}
