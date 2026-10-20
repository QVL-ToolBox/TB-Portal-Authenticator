import { PageContent, Stack } from "@canop/ui";
import type { ReactNode } from "react";
import { useInlineAdminNav } from "../hooks/useInlineAdminNav";
import { AdminErrors } from "./AdminErrors";
import { AdminNav } from "./AdminNav";

export interface AdminPageContentProps {
  title: string;
  errors: readonly string[];
  fillHeight?: boolean;
  children: ReactNode;
}

export function AdminPageContent({
  title,
  errors,
  fillHeight = false,
  children,
}: AdminPageContentProps) {
  const showsInlineNav = useInlineAdminNav();

  return (
    <PageContent title={title} fillHeight={fillHeight}>
      <Stack gap="lg" fill={fillHeight}>
        {showsInlineNav && <AdminNav />}
        <AdminErrors errors={errors} />
        {children}
      </Stack>
    </PageContent>
  );
}
