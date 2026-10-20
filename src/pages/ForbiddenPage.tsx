import { Button, Feedback, Heading, Layout, Stack } from "@canop/ui";
import { useForbiddenPage } from "../hooks/useForbiddenPage";

export function ForbiddenPage() {
  const { appName, title, message, switchLabel, switchAccount } = useForbiddenPage();

  return (
    <Layout brand={appName}>
      <Stack gap="lg">
        <Heading level={1} size={3}>
          {title}
        </Heading>
        <Feedback severity="error">{message}</Feedback>
        <Button variant="secondary" onClick={switchAccount}>
          {switchLabel}
        </Button>
      </Stack>
    </Layout>
  );
}
