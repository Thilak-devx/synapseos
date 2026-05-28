import { PageLoader } from "@/components/feedback/page-loader";

export default function LoginLoading() {
  return (
    <PageLoader
      title="Loading secure access"
      description="Preparing role-aware authentication, protected session state, and seeded demo identities."
    />
  );
}
