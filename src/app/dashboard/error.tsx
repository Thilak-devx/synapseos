"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#0b1120]/95 p-8 text-center shadow-lg shadow-black/10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-[1.4rem] border border-rose-300/18 bg-rose-300/10">
          <AlertTriangle className="size-6 text-rose-100" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">Dashboard module unavailable</h2>
        <p className="mt-3 text-white/58">
          SynapseOS protected the rest of the workspace, but this module failed to load.
        </p>
        <p className="mt-3 text-sm text-white/38">{error.message || "Unknown dashboard error."}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="rounded-full bg-white text-black hover:bg-white/90" onClick={reset}>
            <RefreshCw className="size-4" />
            Retry module
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.08] hover:text-white"
            onClick={() => window.location.assign("/dashboard")}
          >
            Go to role home
          </Button>
        </div>
      </div>
    </div>
  );
}
