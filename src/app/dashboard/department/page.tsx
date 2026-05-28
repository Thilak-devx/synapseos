import { redirect } from "next/navigation";

export default function LegacyDepartmentPage() {
  redirect("/dashboard/departments");
}
