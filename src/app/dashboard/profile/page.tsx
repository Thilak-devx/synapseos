import { requirePermission } from "@/lib/auth-guards";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { getDashboardSnapshotForRole } from "@/services/dashboard.service";

export default async function DashboardProfilePage() {
  const session = await requirePermission(["profile:manage"], "/dashboard/profile");
  const snapshot = await getDashboardSnapshotForRole(session.user.role, {
    userEmail: session.user.email,
    userId: session.user.id,
    userName: session.user.name,
  });

  return (
    <DashboardPage
      role={session.user.role}
      section="profile"
      snapshot={snapshot}
      userName={session.user.name ?? "SynapseOS User"}
    />
  );
}
