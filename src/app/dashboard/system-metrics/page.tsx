import { requireRole } from "@/lib/auth-guards";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { getDashboardSnapshotForRole } from "@/services/dashboard.service";

export default async function DashboardSystemMetricsPage() {
  const session = await requireRole(["ADMIN"], "/dashboard/system-metrics");
  const snapshot = await getDashboardSnapshotForRole(session.user.role, {
    userEmail: session.user.email,
    userId: session.user.id,
    userName: session.user.name,
  });

  return (
    <DashboardPage
      role={session.user.role}
      section="system-metrics"
      snapshot={snapshot}
      userName={session.user.name ?? "SynapseOS User"}
    />
  );
}
