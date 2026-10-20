import { CardGrid, StatCard } from "@canop/ui";
import type { AdminUser } from "../api/adminApi";
import { useDashboardStats } from "../hooks/useDashboardStats";

const STAT_MIN_WIDTH = "13rem";

export interface DashboardStatsProps {
  users: readonly AdminUser[];
}

export function DashboardStats({ users }: DashboardStatsProps) {
  const stats = useDashboardStats(users);

  return (
    <CardGrid minItemWidth={STAT_MIN_WIDTH} gap="md">
      {stats.map((stat) => (
        <StatCard
          key={stat.key}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          iconColor={stat.iconColor}
          animated
        />
      ))}
    </CardGrid>
  );
}
