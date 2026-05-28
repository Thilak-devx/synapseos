"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Orbit } from "lucide-react";
import { Shell } from "@/components/layout/shell";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <main className="relative flex flex-1 items-center overflow-hidden py-10 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(83,168,255,0.18),_transparent_28%),radial-gradient(circle_at_85%_20%,_rgba(171,101,255,0.16),_transparent_24%),linear-gradient(180deg,_rgba(8,10,22,0.1),_rgba(8,10,22,0.6))]" />
      <div className="ambient-orb left-[-8rem] top-20 h-52 w-52 bg-cyan-400/18" />
      <div className="ambient-orb bottom-16 right-[-6rem] h-64 w-64 bg-violet-500/18" />
      <Shell className="relative z-10 grid items-center gap-6 lg:grid-cols-[0.82fr_1fr] xl:grid-cols-[0.8fr_0.98fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5 lg:pr-4"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <div className="flex size-9 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
              <Orbit className="size-4 text-cyan-100" />
            </div>
            Back to SynapseOS
          </Link>

          <div className="space-y-2.5">
            <p className="type-caption text-cyan-100/70">{eyebrow}</p>
            <h1 className="type-display max-w-lg text-[1.95rem] text-white md:text-[3rem]">
              {title}
            </h1>
            <p className="type-body max-w-md text-sm leading-7 text-white/58 md:text-base">{description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["JWT Sessions", "Stateless secure auth"],
              ["RBAC Controls", "Role-aware route access"],
              ["Audit Ready", "Prisma-backed security models"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-3 backdrop-blur-sm"
              >
                <div className="type-caption text-white/42">{label}</div>
                <div className="mt-2 text-sm text-white/85">{value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-r from-cyan-400/18 via-transparent to-violet-500/18 blur-3xl" />
          <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.05] p-2.5 backdrop-blur-sm">
            <div className="rounded-[1.7rem] border border-white/10 bg-[#0b1020]/92 p-5 shadow-[0_24px_120px_rgba(0,0,0,0.4)] md:p-6">
              {children}
              <div className="mt-4 border-t border-white/8 pt-4 text-sm text-white/52">{footer}</div>
            </div>
          </div>
        </motion.div>
      </Shell>
    </main>
  );
}
