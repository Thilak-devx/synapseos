import Link from "next/link";
import { Compass, Home, ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] px-6 py-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.1),transparent_26%)]" />
      <section className="relative w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0b1120]/95 p-8 text-center shadow-lg shadow-black/10 md:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          <Compass className="size-7" />
        </div>
        <p className="type-caption mt-6 text-cyan-100/70">404 / Route not found</p>
        <h1 className="type-heading mt-3 text-3xl text-white md:text-5xl">
          This SynapseOS route is outside the active control plane
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/58">
          The requested workspace could not be located. Return to the dashboard or the landing page
          to continue from a safe operational surface.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-white/90"
          >
            <ShieldCheck className="size-4" />
            Open dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
          >
            <Home className="size-4" />
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
