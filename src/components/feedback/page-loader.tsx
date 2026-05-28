import { Orbit, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function PageLoader({
  title = "Loading SynapseOS",
  description = "Preparing the next interface layer, syncing controls, and rendering live workspace context.",
}: {
  description?: string;
  title?: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] px-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(167,139,250,0.16),transparent_24%),linear-gradient(180deg,rgba(3,8,20,0.3),rgba(3,8,20,0.92))]" />
      <div className="relative z-10 w-full max-w-4xl rounded-[2rem] border border-white/10 bg-[#0b1120]/95 p-5 shadow-lg shadow-black/10 md:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                <Orbit className="size-5 animate-spin [animation-duration:5s]" />
              </div>
              <div>
                <p className="type-caption text-cyan-100/70">
                  SynapseOS
                </p>
                <h2 className="type-heading mt-1 text-2xl">{title}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/58">{description}</p>
            <div className="mt-6 flex items-center gap-2 text-sm text-white/48">
              <Sparkles className="size-4 text-violet-200" />
              Rendering secure dashboard modules and visual telemetry
            </div>
          </div>

          <div className="space-y-4 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
            <Skeleton className="h-10 w-40 rounded-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-28 rounded-[1.4rem]" />
              <Skeleton className="h-28 rounded-[1.4rem]" />
            </div>
            <Skeleton className="h-48 rounded-[1.6rem]" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-18 rounded-[1.2rem]" />
              <Skeleton className="h-18 rounded-[1.2rem]" />
              <Skeleton className="h-18 rounded-[1.2rem]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
