import { requireRole } from "@/lib/auth-guards";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { getDashboardSnapshotForRole } from "@/services/dashboard.service";

export default async function DashboardManagerHomePage() {
  const session = await requireRole(["ADMIN", "MANAGER"], "/dashboard/manager");
  const snapshot = await getDashboardSnapshotForRole(session.user.role, {
    userEmail: session.user.email,
    userId: session.user.id,
    userName: session.user.name,
  });

  return (
    <DashboardPage
      role={session.user.role}
      section="overview"
      snapshot={snapshot}
      userName={session.user.name ?? "SynapseOS User"}
    />
  );
}
