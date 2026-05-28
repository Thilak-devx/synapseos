import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guards";

export default async function UserEntryPage() {
  await requireRole(["ADMIN", "MANAGER", "USER"], "/user");
  redirect("/dashboard/user");
}
