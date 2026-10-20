import { Stack, Text } from "@canop/ui";

export interface TrafficMetricRowProps {
  label: string;
  value: number;
  emphasized?: boolean;
}

export function TrafficMetricRow({ label, value, emphasized = false }: TrafficMetricRowProps) {
  return (
    <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap="md">
      <Text tone={emphasized ? "muted" : undefined}>{label}</Text>
      <Text
        variant={emphasized ? "body-lg" : "body-md"}
        weight={emphasized ? "bold" : "semibold"}
        tabularNums
      >
        {value}
      </Text>
    </Stack>
  );
}
