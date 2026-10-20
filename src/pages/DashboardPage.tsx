import { CardGrid } from "@canop/ui";
import { AdminPageContent } from "../components/AdminPageContent";
import { AdminToast } from "../components/AdminToast";
import { DashboardStats } from "../components/DashboardStats";
import { PendingUsersCard } from "../components/PendingUsersCard";
import { RegistrationToggleCard } from "../components/RegistrationToggleCard";
import { TrafficCard } from "../components/TrafficCard";
import { useDashboardPage } from "../hooks/useDashboardPage";

const DASHBOARD_CARD_MIN_WIDTH = "20rem";

export function DashboardPage() {
  const {
    title,
    users,
    loading,
    errors,
    pendingUsers,
    registrationEnabled,
    registrationLocked,
    toggleRegistration,
    approve,
    reject,
    toast,
    closeToast,
  } = useDashboardPage();

  return (
    <AdminPageContent title={title} errors={errors}>
      <DashboardStats users={users} />
      <RegistrationToggleCard
        enabled={registrationEnabled}
        disabled={registrationLocked}
        onChange={toggleRegistration}
      />
      <CardGrid minItemWidth={DASHBOARD_CARD_MIN_WIDTH} gap="md">
        <TrafficCard />
        {pendingUsers.length > 0 && (
          <PendingUsersCard
            users={pendingUsers}
            loading={loading}
            onApprove={approve}
            onReject={reject}
          />
        )}
      </CardGrid>
      <AdminToast toast={toast} onClose={closeToast} />
    </AdminPageContent>
  );
}
