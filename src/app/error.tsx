"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-white">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0b1120]/95 p-10 text-center shadow-lg shadow-black/10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10">
          <AlertTriangle className="size-7 text-amber-100" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-white">
          SynapseOS hit an unexpected fault
        </h1>
        <p className="mt-4 text-white/58">
          The workspace recovered safely, but this request could not complete. Retry the action or
          return to the protected dashboard shell.
        </p>
        <p className="mt-4 text-sm text-white/38">
          {error.message || "Unknown application error."}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            className="rounded-full bg-white text-black hover:bg-white/90"
            onClick={reset}
          >
            <RefreshCw className="size-4" />
            Retry request
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.08] hover:text-white"
            onClick={() => window.location.assign("/dashboard")}
          >
            Return to dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}
