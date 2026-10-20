import { Feedback, Presence, PresenceItem, Stack } from "@canop/ui";

export interface AdminErrorsProps {
  errors: readonly string[];
}

export function AdminErrors({ errors }: AdminErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <Stack gap="sm">
      <Presence appear>
        {errors.map((error) => (
          <PresenceItem key={error} layout>
            <Feedback severity="error">{error}</Feedback>
          </PresenceItem>
        ))}
      </Presence>
    </Stack>
  );
}
