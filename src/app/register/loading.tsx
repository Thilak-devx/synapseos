import { PageLoader } from "@/components/feedback/page-loader";

export default function RegisterLoading() {
  return (
    <PageLoader
      title="Preparing account workflow"
      description="Initializing validation, secure credential fields, and RBAC defaults for registration."
    />
  );
}
