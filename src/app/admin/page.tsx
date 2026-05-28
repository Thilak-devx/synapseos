import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guards";

export default async function AdminEntryPage() {
  await requireRole(["ADMIN"], "/admin");
  redirect("/dashboard/admin");
}
