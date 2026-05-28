import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl =
    typeof params?.callbackUrl === "string" ? params.callbackUrl : "/dashboard";

  redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}` as never);
}
