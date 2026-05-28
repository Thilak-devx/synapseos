import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDefaultDashboardPathForRole } from "@/lib/rbac";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect(getDefaultDashboardPathForRole(session.user.role));
  }

  const params = await searchParams;
  const callbackUrl =
    typeof params?.callbackUrl === "string" ? params.callbackUrl : "/dashboard";

  return (
    <AuthShell
      eyebrow="Secure authentication"
      title="Access the intelligent database command layer."
      description="SynapseOS authentication combines JWT sessions, route protection, RBAC, and a hardened credentials flow for production-grade access control."
      footer={
        <span>
          Demo access is preconfigured.
        </span>
      }
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
