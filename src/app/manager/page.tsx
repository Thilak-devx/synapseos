import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guards";

export default async function ManagerEntryPage() {
  await requireRole(["ADMIN", "MANAGER"], "/manager");
  redirect("/dashboard/manager");
}
