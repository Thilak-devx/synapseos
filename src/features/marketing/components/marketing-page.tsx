"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BellRing,
  BrainCircuit,
  Command,
  FileBarChart2,
  Fingerprint,
  GitBranch,
  Layers3,
  LockKeyhole,
  Menu,
  Orbit,
  Radar,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "Security", href: "#security" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "GitHub", href: "https://github.com/" },
];

const platformFeatures = [
  {
    title: "Role-aware command surfaces",
    description: "Admin, manager, and user experiences stay separated by middleware, route guards, API checks, and server-side permission validation.",
    icon: Fingerprint,
  },
  {
    title: "DBMS-backed report engine",
    description: "Create, archive, duplicate, restore, and export operational reports with transaction metadata and audit history attached.",
    icon: FileBarChart2,
  },
  {
    title: "AI operational copilot",
    description: "Ask for health summaries, anomaly explanations, RBAC reviews, audit summaries, and executive-grade operational insights.",
    icon: BrainCircuit,
  },
  {
    title: "Realtime simulation layer",
    description: "Live metrics, alerts, notifications, activity feeds, and chart signals make the platform feel actively operational during demos.",
    icon: Radar,
  },
];

const workflowSteps = [
  {
    title: "Request enters",
    detail: "Operator action, report workflow, or dashboard query is scoped to the active session.",
    icon: Command,
  },
  {
    title: "RBAC validates",
    detail: "Role, route, API permission, department scope, and action boundary are checked.",
    icon: LockKeyhole,
  },
  {
    title: "Prisma commits",
    detail: "Transactions persist reports, notifications, activity logs, and audit events safely.",
    icon: Layers3,
  },
  {
    title: "AI analyzes",
    detail: "Metrics, reports, users, and audit signals become contextual operational intelligence.",
    icon: BrainCircuit,
  },
  {
    title: "Control plane updates",
    detail: "Dashboards, alerts, exports, and notifications refresh for the correct role.",
    icon: BellRing,
  },
];

const securitySignals = [
  "Admin-only global controls",
  "Manager department boundaries",
  "User personal workspace isolation",
  "Unauthorized redirects",
  "Privileged audit events",
  "Secure session handling",
];

const stack = [
  "Next.js App Router",
  "TypeScript",
  "Tailwind CSS",
  "Auth.js / NextAuth",
  "Prisma ORM",
  "PostgreSQL / Neon",
  "Framer Motion",
  "Recharts",
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

function SectionReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.18 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={stagger}
      className={cn("[content-visibility:auto] [contain-intrinsic-size:720px]", className)}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  align?: "center" | "left";
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={cn("max-w-3xl", align === "center" ? "mx-auto text-center" : "")}
    >
      <Badge className="type-caption rounded-full border border-cyan-300/18 bg-cyan-300/10 px-4 py-1 text-cyan-100">
        {eyebrow}
      </Badge>
      <h2 className="type-display mt-5 text-3xl leading-tight text-white md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-white/58 md:text-base">
        {description}
      </p>
    </motion.div>
  );
}

function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,30,0.88),rgba(10,18,36,0.82))] p-5 shadow-lg shadow-black/10",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
      {children}
    </div>
  );
}

function DashboardPreview() {
  return (
    <motion.div variants={fadeUp} className="relative">
      <div className="absolute -inset-4 rounded-[2.4rem] bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_85%_30%,rgba(99,102,241,0.14),transparent_30%)]" />
      <div className="relative rounded-[2rem] border border-white/12 bg-[#060b16] p-3 shadow-2xl shadow-black/30">
        <div className="rounded-[1.6rem] border border-white/10 bg-[#081120] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
            <div>
              <p className="type-caption text-cyan-100/60">Admin Control Center</p>
              <h3 className="type-heading mt-1 text-xl text-white">Operational command layer</h3>
            </div>
            <Badge className="rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
              <span className="mr-1.5 size-1.5 rounded-full bg-emerald-300" />
              System stable
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ["Users", "184K"],
              ["Reports", "2,418"],
              ["Txn/sec", "96K"],
              ["Uptime", "99.982%"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.1rem] border border-white/8 bg-white/[0.035] p-3">
                <p className="text-xs text-white/42">{label}</p>
                <p className="type-metric mt-2 text-xl text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-white">Throughput timeline</p>
                <p className="type-caption text-cyan-100/60">Live</p>
              </div>
              <div className="flex h-44 items-end gap-2">
                {[38, 52, 44, 68, 61, 76, 70, 86, 78, 92, 83, 96].map((height, index) => (
                  <div
                    key={`${height}-${index}`}
                    className="flex-1 rounded-t-lg bg-gradient-to-t from-cyan-500/25 to-cyan-200/80"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: ShieldCheck, label: "RBAC sync", value: "Verified" },
                { icon: BrainCircuit, label: "AI anomaly scan", value: "1 signal" },
                { icon: Activity, label: "Audit stream", value: "Live" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-white/45">{label}</p>
                      <p className="mt-1 font-medium text-white">{value}</p>
                    </div>
                    <Icon className="size-5 text-cyan-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function MarketingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_86%_8%,rgba(99,102,241,0.12),transparent_28%),linear-gradient(180deg,rgba(6,10,24,0.28),rgba(5,8,22,0.95))]" />
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-[0.08]" />

      <main className="relative z-10">
        <section className="mx-auto w-full max-w-7xl px-5 pt-5 md:px-8">
          <motion.nav
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            className="sticky top-4 z-40 rounded-full border border-white/12 bg-[#081120]/88 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-sm md:px-5"
          >
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/24 bg-cyan-300/10">
                  <Orbit className="size-5 text-cyan-100" />
                </div>
                <div className="min-w-0">
                  <div className="type-heading text-sm text-white md:text-base">SYNAPSEOS</div>
                  <div className="hidden text-xs text-white/40 sm:block">Enterprise DBMS control plane</div>
                </div>
              </Link>

              <div className="hidden items-center gap-6 lg:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-white/62 transition-colors duration-200 hover:text-white"
                    target={item.label === "GitHub" ? "_blank" : undefined}
                    rel={item.label === "GitHub" ? "noreferrer" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger
                    render={
                      <button className="flex size-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white transition-colors hover:bg-white/[0.08] lg:hidden">
                        <Menu className="size-4" />
                      </button>
                    }
                  />
                  <SheetContent side="right" className="border-white/10 bg-[#07101f] text-white">
                    <SheetHeader>
                      <SheetTitle className="text-white">SynapseOS</SheetTitle>
                      <SheetDescription className="text-white/55">
                        A focused path through the enterprise DBMS story.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-8 grid gap-3">
                      {navItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/78 transition-colors hover:bg-white/[0.08]"
                          target={item.label === "GitHub" ? "_blank" : undefined}
                          rel={item.label === "GitHub" ? "noreferrer" : undefined}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
                <Link
                  href="/login"
                  className="hidden rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/78 transition-colors hover:bg-white/[0.08] hover:text-white sm:inline-flex"
                >
                  Login
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "rounded-full border border-cyan-200/20 bg-gradient-to-r from-cyan-300 to-blue-500 px-5 text-slate-950 shadow-sm shadow-cyan-950/20 transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-110",
                  )}
                >
                  Launch
                </Link>
              </div>
            </div>
          </motion.nav>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 pb-12 pt-14 md:px-8 md:pb-16 md:pt-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <SectionReveal>
            <motion.div variants={fadeUp}>
              <Badge className="type-caption rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-cyan-100">
                AI-powered enterprise DBMS operations
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="type-display mt-6 max-w-5xl text-4xl leading-[1.02] text-white md:text-6xl xl:text-7xl"
            >
              The command layer for intelligent database operations.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-base leading-8 text-white/62 md:text-lg">
              SynapseOS turns RBAC, report workflows, audit trails, AI analytics, and realtime
              infrastructure monitoring into one premium control plane for enterprise data teams.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "group rounded-full border border-cyan-200/20 bg-gradient-to-r from-cyan-300 to-blue-500 px-7 text-slate-950 shadow-sm shadow-cyan-950/20 transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-110",
                )}
              >
                Enter the Command Layer
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#architecture"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full border-white/12 bg-white/[0.04] px-7 text-white transition-colors hover:bg-white/[0.08] hover:text-white",
                )}
              >
                View architecture
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["RBAC", "Role-safe operations"],
                ["AI", "Contextual insights"],
                ["Audit", "Traceable workflows"],
              ].map(([label, value]) => (
                <SurfaceCard key={label} className="p-4">
                  <p className="type-caption text-cyan-100/55">{label}</p>
                  <p className="mt-2 text-sm font-medium text-white">{value}</p>
                </SurfaceCard>
              ))}
            </motion.div>
          </SectionReveal>

          <DashboardPreview />
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
          <SectionReveal>
            <SectionHeader
              eyebrow="Focused platform"
              title="Everything judges need to understand in one tight product story."
              description="SynapseOS is not a generic dashboard. It demonstrates authentication, authorization, transactions, reporting, monitoring, notifications, and AI assistance as one coherent DBMS operating layer."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {platformFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={feature.title} variants={fadeUp}>
                    <SurfaceCard className="h-full transition-colors duration-200 hover:border-cyan-300/20">
                      <div className="flex size-11 items-center justify-center rounded-[1.1rem] border border-cyan-300/18 bg-cyan-300/10">
                        <Icon className="size-5 text-cyan-100" />
                      </div>
                      <h3 className="type-heading mt-5 text-lg text-white">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-white/56">{feature.description}</p>
                    </SurfaceCard>
                  </motion.div>
                );
              })}
            </div>
          </SectionReveal>
        </section>

        <section id="architecture" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
          <SectionReveal className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <SectionHeader
              align="left"
              eyebrow="Operational workflow"
              title="From request to audited intelligence."
              description="The landing page now explains the actual enterprise flow: identity enters, RBAC validates, Prisma commits, AI analyzes, and role-aware workspaces update."
            />
            <motion.div variants={fadeUp} className="grid gap-3">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <SurfaceCard key={step.title} className="p-4">
                    <div className="grid gap-4 sm:grid-cols-[48px_1fr_auto] sm:items-center">
                      <div className="flex size-12 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/[0.045]">
                        <Icon className="size-5 text-cyan-100" />
                      </div>
                      <div>
                        <p className="type-caption text-white/36">Step {String(index + 1).padStart(2, "0")}</p>
                        <h3 className="mt-1 font-medium text-white">{step.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-white/52">{step.detail}</p>
                      </div>
                      <Badge className="w-fit rounded-full border border-emerald-300/18 bg-emerald-300/10 text-emerald-100">
                        Live
                      </Badge>
                    </div>
                  </SurfaceCard>
                );
              })}
            </motion.div>
          </SectionReveal>
        </section>

        <section id="security" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
          <SectionReveal className="grid gap-6 lg:grid-cols-3">
            <motion.div variants={fadeUp} className="lg:col-span-1">
              <SurfaceCard className="h-full">
                <ShieldCheck className="size-9 text-cyan-100" />
                <h2 className="type-display mt-5 text-3xl text-white md:text-4xl">
                  RBAC that feels visible, not hidden.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/58">
                  The platform explicitly demonstrates admin, manager, and user boundaries with
                  protected routes and scoped operations.
                </p>
              </SurfaceCard>
            </motion.div>
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <SurfaceCard>
                <div className="grid gap-3 sm:grid-cols-2">
                  {securitySignals.map((signal) => (
                    <div key={signal} className="flex items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-3">
                      <BadgeCheck className="size-4 shrink-0 text-cyan-100" />
                      <span className="text-sm text-white/68">{signal}</span>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </motion.div>
          </SectionReveal>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
          <SectionReveal className="grid gap-4 lg:grid-cols-3">
            {[
              {
                eyebrow: "AI analytics pipeline",
                title: "Operational context becomes insight",
                description: "Reports, metrics, activity logs, notifications, and role data feed the AI Command Center for realistic enterprise responses.",
                icon: BrainCircuit,
              },
              {
                eyebrow: "Realtime monitoring",
                title: "A platform that feels alive",
                description: "CPU, memory, DB load, active sessions, query latency, alerts, and activity streams update without heavy animation overhead.",
                icon: Activity,
              },
              {
                eyebrow: "Report operations",
                title: "Workflow, export, audit",
                description: "Report actions generate downloadable artifacts, lifecycle changes, notifications, and audit entries.",
                icon: FileBarChart2,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.title} variants={fadeUp}>
                  <SurfaceCard className="h-full">
                    <Icon className="size-8 text-cyan-100" />
                    <p className="type-caption mt-5 text-cyan-100/58">{item.eyebrow}</p>
                    <h3 className="type-heading mt-3 text-xl text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/56">{item.description}</p>
                  </SurfaceCard>
                </motion.div>
              );
            })}
          </SectionReveal>
        </section>

        <section id="dashboard" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
          <SectionReveal className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionHeader
              align="left"
              eyebrow="Dashboard preview"
              title="Real product mockup, not abstract decoration."
              description="The preview mirrors SynapseOS dashboard patterns: compact KPI cards, RBAC status, live audit signals, AI monitoring, and throughput visualization in the same visual system as the app."
            />
            <DashboardPreview />
          </SectionReveal>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
          <SectionReveal className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <SectionHeader
              align="left"
              eyebrow="Tech stack"
              title="Built on production SaaS primitives."
              description="Modern Next.js architecture, typed workflows, secure auth, Prisma-backed persistence, and deployment-ready PostgreSQL support."
            />
            <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2">
              {stack.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[1.15rem] border border-white/8 bg-white/[0.035] p-4">
                  <TerminalSquare className="size-4 text-cyan-100" />
                  <span className="text-sm text-white/68">{item}</span>
                </div>
              ))}
            </motion.div>
          </SectionReveal>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-16">
          <SectionReveal>
            <motion.div
              variants={fadeUp}
              className="relative overflow-hidden rounded-[2rem] border border-cyan-300/14 bg-[linear-gradient(135deg,rgba(8,20,40,0.94),rgba(10,18,36,0.88))] p-7 text-center shadow-lg shadow-black/10 md:p-12"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_34%)]" />
              <div className="relative mx-auto max-w-3xl">
                <Badge className="type-caption rounded-full border border-white/12 bg-white/[0.06] px-4 py-1 text-white/62">
                  Demo ready
                </Badge>
                <h2 className="type-display mt-5 text-3xl text-white md:text-5xl">
                  Experience Intelligent Operations.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/58 md:text-base">
                  Launch SynapseOS and show judges a focused enterprise DBMS platform with real
                  RBAC storytelling, AI analytics, report workflows, and realtime monitoring.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/dashboard"
                    className={cn(
                      buttonVariants({ variant: "default", size: "lg" }),
                      "rounded-full border border-cyan-200/20 bg-gradient-to-r from-cyan-300 to-blue-500 px-7 text-slate-950 hover:brightness-110",
                    )}
                  >
                    Launch SynapseOS
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "rounded-full border-white/12 bg-white/[0.04] px-7 text-white hover:bg-white/[0.08] hover:text-white",
                    )}
                  >
                    Demo login
                  </Link>
                </div>
              </div>
            </motion.div>
          </SectionReveal>
        </section>

        <footer className="mx-auto w-full max-w-7xl px-5 pb-10 md:px-8">
          <div className="rounded-[1.6rem] border border-white/10 bg-[#081120]/88 p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                  <Orbit className="size-5 text-cyan-100" />
                </div>
                <div>
                  <div className="type-heading text-white">SYNAPSEOS</div>
                  <div className="text-sm text-white/42">Intelligent database operations</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-white/46">
                <Link href="#features" className="hover:text-white">Features</Link>
                <Link href="#architecture" className="hover:text-white">Architecture</Link>
                <Link href="#security" className="hover:text-white">Security</Link>
                <Link href="#dashboard" className="hover:text-white">Dashboard</Link>
                <Link href="https://github.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">
                  <GitBranch className="size-4" />
                  GitHub
                </Link>
              </div>
            </div>
            <div className="mt-6 border-t border-white/8 pt-5 text-sm text-white/36">
              (c) 2026 SynapseOS. Built for premium enterprise DBMS demos and production-style SaaS storytelling.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
