import { Icon, Layout } from "@canop/ui";
import { useAuthPortal } from "../config/AuthPortalContext";
import type { PortalLayoutProps } from "../config/authPortalConfig";

const DEFAULT_LOGO = <Icon name="home" variant="solid" color="accent" size="lg" />;

export function AuthBrandLayout({ children }: PortalLayoutProps) {
  const { config } = useAuthPortal();
  const { logo, header, animatedShapes, maxWidth, showUtilities } = config.branding;

  return (
    <Layout
      brand={config.appName}
      logo={logo ?? DEFAULT_LOGO}
      header={header}
      maxWidth={maxWidth}
      animatedShapes={animatedShapes}
      showUtilities={showUtilities}
    >
      {children}
    </Layout>
  );
}
