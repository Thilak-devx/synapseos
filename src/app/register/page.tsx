import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDefaultDashboardPathForRole } from "@/lib/rbac";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect(getDefaultDashboardPathForRole(session.user.role));
  }

  return (
    <AuthShell
      eyebrow="Provision access"
      title="Create a secure SynapseOS identity in minutes."
      description="New accounts are created with hashed passwords, validated with Zod, and assigned least-privilege user access by default."
      footer={<span>Need admin elevation? An administrator can promote your role after signup.</span>}
    >
      <RegisterForm />
    </AuthShell>
  );
}
