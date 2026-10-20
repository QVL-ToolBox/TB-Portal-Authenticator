import { Button, Feedback, Spinner, useTranslation } from "@canop/ui";
import { AuthPageContent } from "../components/AuthPageContent";
import { ProfileDetails } from "../components/ProfileDetails";
import { useAccount } from "../hooks/useAccount";

export function AccountPage() {
  const { t } = useTranslation();
  const { me, error, signOut } = useAccount();

  return (
    <AuthPageContent title={t("auth.account.title")}>
      {error ? (
        <Feedback severity="error">{error}</Feedback>
      ) : !me ? (
        <Spinner ariaLabel={t("auth.loading")} />
      ) : (
        <>
          <ProfileDetails me={me} />
          <Button variant="accent" onClick={signOut}>
            {t("auth.account.logout")}
          </Button>
        </>
      )}
    </AuthPageContent>
  );
}
