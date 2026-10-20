import { CardGrid, EmptyState, Presence, Spinner, useTranslation } from "@canop/ui";
import type { ReactNode } from "react";

const CARD_MIN_WIDTH = "17.5rem";
const CARD_STAGGER_SECONDS = 0.06;

export interface AdminCardGridProps {
  loading: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  children: ReactNode;
}

export function AdminCardGrid({ loading, isEmpty, emptyTitle, children }: AdminCardGridProps) {
  const { t } = useTranslation();

  if (loading) return <Spinner ariaLabel={t("auth.loading")} />;
  if (isEmpty) return <EmptyState title={emptyTitle} surface="plain" />;

  return (
    <CardGrid minItemWidth={CARD_MIN_WIDTH} gap="md">
      <Presence stagger={CARD_STAGGER_SECONDS} appear>
        {children}
      </Presence>
    </CardGrid>
  );
}
