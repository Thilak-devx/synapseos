import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-guards";
import { getDefaultDashboardPathForRole } from "@/lib/rbac";

export default async function DashboardRootPage() {
  const session = await requireAuth("/dashboard");
  redirect(getDefaultDashboardPathForRole(session.user.role));
}
