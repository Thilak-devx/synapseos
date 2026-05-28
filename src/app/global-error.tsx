"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-white">
          <section className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0b1120]/95 p-8 text-center shadow-lg shadow-black/10 md:p-10">
            <div className="mx-auto flex size-16 items-center justify-center rounded-[1.5rem] border border-rose-300/20 bg-rose-300/10">
              <AlertTriangle className="size-7 text-rose-100" />
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.24em] text-rose-100/70">
              Global recovery boundary
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">
              SynapseOS recovered from a critical interface fault
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/58">
              The shell failed before the normal route boundary could recover it. Retry the render
              or return to the public entry point.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button className="rounded-full bg-white text-black hover:bg-white/90" onClick={reset}>
                <RefreshCw className="size-4" />
                Retry
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.08] hover:text-white"
                onClick={() => window.location.assign("/")}
              >
                <Home className="size-4" />
                Return home
              </Button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
