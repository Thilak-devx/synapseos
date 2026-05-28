import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function UnauthorizedPage() {
  return (
    <main className="relative flex flex-1 items-center overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(83,168,255,0.18),_transparent_28%),radial-gradient(circle_at_85%_20%,_rgba(171,101,255,0.16),_transparent_24%),linear-gradient(180deg,_rgba(8,10,22,0.1),_rgba(8,10,22,0.6))]" />
      <Shell className="flex justify-center">
        <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1120]/95 p-10 text-center shadow-lg shadow-black/10">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
          <div className="mx-auto flex size-20 items-center justify-center rounded-[2rem] border border-rose-300/20 bg-rose-300/10 shadow-sm shadow-rose-950/20">
            <ShieldAlert className="size-9 text-rose-200" />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.34em] text-rose-100/70">
            403 · insufficient permissions
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">Access denied</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/58">
            Your current role is authenticated, but this workspace requires a higher privilege
            level. SynapseOS blocked the request before any restricted data was revealed.
          </p>
          <div className="mx-auto mt-8 grid max-w-2xl gap-4 text-left sm:grid-cols-3">
            {[
              ["Route protection", "Middleware blocked direct navigation."],
              ["Server validation", "Restricted APIs remain locked behind role checks."],
              ["Audit visibility", "Permission denials are safe and observable."],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4"
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{label}</p>
                <p className="mt-2 text-sm text-white/72">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "rounded-full border border-cyan-200/20 bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 text-slate-950",
              )}
            >
              <ArrowRight className="size-4" />
              Return to dashboard
            </Link>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-full border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.08] hover:text-white",
              )}
            >
              Back to site
            </Link>
          </div>
        </div>
      </Shell>
    </main>
  );
}
