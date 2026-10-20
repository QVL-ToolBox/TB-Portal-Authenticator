import { Heading, Stack, type CanopHeadingLevel } from "@canop/ui";
import type { ReactNode } from "react";

export interface LegalSectionProps {
  title: string;
  level?: CanopHeadingLevel;
  children: ReactNode;
}

export function LegalSection({ title, level = 3, children }: LegalSectionProps) {
  return (
    <Stack as="section" gap="sm">
      <Heading level={level} size={5}>
        {title}
      </Heading>
      {children}
    </Stack>
  );
}
