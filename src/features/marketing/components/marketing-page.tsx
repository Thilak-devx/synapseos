"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { animate, motion, useInView } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BellRing,
  BrainCircuit,
  Database,
  FileBarChart2,
  Fingerprint,
  Layers3,
  Menu,
  Orbit,
  Play,
  Radar,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = ["Platform", "Solutions", "Showcase", "How It Works", "Resources"];

const featureCards = [
  {
    title: "RBAC Security",
    description:
      "Granular permissions, encrypted environments, and policy engines designed for regulated teams.",
    icon: Fingerprint,
    accent: "from-cyan-400/30 via-sky-400/10 to-transparent",
  },
  {
    title: "AI Analytics",
    description:
      "Ask complex data questions in natural language and surface predictive operational insights instantly.",
    icon: BrainCircuit,
    accent: "from-fuchsia-400/30 via-violet-400/10 to-transparent",
  },
  {
    title: "Smart Automation",
    description:
      "Deploy autonomous playbooks that heal incidents, optimize queries, and orchestrate workflows.",
    icon: WandSparkles,
    accent: "from-emerald-400/30 via-teal-400/10 to-transparent",
  },
  {
    title: "Realtime Monitoring",
    description:
      "Stream live telemetry, anomaly signals, and performance traces from every cluster and tenant.",
    icon: Activity,
    accent: "from-orange-400/30 via-amber-400/10 to-transparent",
  },
  {
    title: "Enterprise Database",
    description:
      "High-availability architecture with distributed replicas, isolation controls, and multi-region readiness.",
    icon: Database,
    accent: "from-indigo-400/30 via-blue-400/10 to-transparent",
  },
  {
    title: "Advanced Transactions",
    description:
      "Coordinate mission-critical writes with observability-rich transaction pipelines and rollback confidence.",
    icon: Layers3,
    accent: "from-pink-400/30 via-rose-400/10 to-transparent",
  },
];

const stats = [
  { label: "Active Users", value: 184000, suffix: "+", prefix: "" },
  { label: "Database Operations", value: 3200000000, suffix: "+", prefix: "" },
  { label: "Transactions/sec", value: 96000, suffix: "+", prefix: "" },
  { label: "Uptime", value: 99.999, suffix: "%", prefix: "" },
];

const testimonials = [
  {
    quote:
      "SynapseOS made our database ops feel like a product surface, not a maintenance burden.",
    name: "Ariana Vale",
    role: "VP Engineering, HelioStack",
  },
  {
    quote:
      "The blend of AI observability and transaction control gave our SRE team superhuman context.",
    name: "Marcus Iden",
    role: "Infrastructure Lead, Quantive",
  },
  {
    quote:
      "It feels like Linear met Stripe for database operations, then layered autonomous workflows on top.",
    name: "Sana Rhee",
    role: "CTO, Northstar Cloud",
  },
];

const workflowSteps = [
  {
    title: "User Request",
    description:
      "An operator, analyst, or product team initiates a scoped request across the SynapseOS control plane.",
    icon: Orbit,
    accent: "from-cyan-400/24 via-sky-400/12 to-transparent",
    metadata: ["Input signed", "Tenant scoped", "Intent captured"],
    detail: "API ingress • Session context",
  },
  {
    title: "RBAC Validation",
    description:
      "SynapseOS validates role scope, permission boundaries, and department-level policies before any write path opens.",
    icon: Fingerprint,
    accent: "from-violet-400/22 via-fuchsia-400/10 to-transparent",
    metadata: ["Role check", "Policy graph", "Access trace"],
    detail: "Auth layer • Zero-trust gate",
  },
  {
    title: "Prisma Transaction",
    description:
      "Critical mutations execute through validated Prisma transactions with rollback safety, referential integrity, and audit anchors.",
    icon: Layers3,
    accent: "from-emerald-400/22 via-teal-400/10 to-transparent",
    metadata: ["ACID flow", "Rollback ready", "Integrity locked"],
    detail: "Database layer • Transaction pipeline",
  },
  {
    title: "AI Analytics Engine",
    description:
      "Telemetry and historical context feed the intelligence layer to surface anomaly signals, summaries, and recommended actions.",
    icon: BrainCircuit,
    accent: "from-cyan-400/22 via-blue-400/10 to-transparent",
    metadata: ["Anomaly scan", "Signal fusion", "Trend scoring"],
    detail: "Inference layer • Analytics mesh",
  },
  {
    title: "Operational Report",
    description:
      "A structured report is generated with metrics, execution metadata, previewable artifacts, and export-ready output formats.",
    icon: FileBarChart2,
    accent: "from-amber-400/22 via-orange-400/10 to-transparent",
    metadata: ["PDF / CSV / JSON", "Metrics attached", "Preview rendered"],
    detail: "Reporting layer • Delivery payload",
  },
  {
    title: "Audit Logging + Notifications",
    description:
      "Every action is written to the audit stream and routed into role-aware alerts so operators retain full operational visibility.",
    icon: BellRing,
    accent: "from-pink-400/22 via-rose-400/10 to-transparent",
    metadata: ["Audit persisted", "Alert fanned out", "Timeline updated"],
    detail: "Control layer • Observability finish",
  },
];

const footerColumns = [
  {
    title: "Platform",
    items: ["Database Ops", "AI Analytics", "Automation", "Security"],
  },
  {
    title: "Company",
    items: ["About", "Careers", "Customers", "Contact"],
  },
  {
    title: "Resources",
    items: ["Docs", "Guides", "Changelog", "Status"],
  },
  {
    title: "Legal",
    items: ["Privacy", "Terms", "Security", "DPA"],
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 6,
    ease: "easeInOut" as const,
    repeat: Number.POSITIVE_INFINITY,
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
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Counter({
  value,
  label,
  suffix,
  prefix,
}: {
  value: number;
  label: string;
  suffix: string;
  prefix: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView) {
      return;
    }

    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(latest) {
        setDisplayValue(latest);
      },
    });

    return () => controls.stop();
  }, [inView, value]);

  const formatted = useMemo(() => {
    if (value >= 1000000000) {
      return `${(displayValue / 1000000000).toFixed(1)}B`;
    }

    if (value >= 1000000) {
      return `${(displayValue / 1000000).toFixed(1)}M`;
    }

    if (value >= 1000 && value !== 99.999) {
      return `${Math.round(displayValue / 100) / 10}K`;
    }

    if (value === 99.999) {
      return displayValue.toFixed(3);
    }

    return Math.round(displayValue).toString();
  }, [displayValue, value]);

  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      className="rounded-[1.8rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="type-metric text-4xl md:text-5xl">
        {prefix}
        {formatted}
        {suffix}
      </div>
      <p className="type-caption mt-3 text-white/48">{label}</p>
    </motion.div>
  );
}

export function MarketingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060816] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(83,168,255,0.2),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(171,101,255,0.18),_transparent_24%),radial-gradient(circle_at_50%_100%,_rgba(29,206,160,0.12),_transparent_24%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(10,12,24,0.35),_rgba(5,6,14,0.9))]" />
        <div className="surface-grid absolute inset-0 opacity-[0.14]" />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full bg-cyan-300/70 shadow-[0_0_30px_rgba(69,211,255,0.45)]"
            style={{
              width: index % 3 === 0 ? 4 : 2,
              height: index % 3 === 0 ? 4 : 2,
              left: `${(index * 13) % 100}%`,
              top: `${(index * 17) % 100}%`,
            }}
            animate={{
              y: [0, -24, 0],
              opacity: [0.18, 0.8, 0.18],
            }}
            transition={{
              duration: 5 + (index % 4),
              delay: index * 0.15,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <main className="relative z-10">
        <section className="mx-auto w-full max-w-7xl px-5 pt-6 md:px-8">
          <motion.nav
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="sticky top-4 z-40 rounded-full border border-white/12 bg-white/[0.08] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:px-6"
          >
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="relative flex size-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_32px_rgba(72,211,255,0.22)]">
                  <Orbit className="size-5 text-cyan-200" />
                </div>
                <div>
                  <div className="type-heading text-base text-white">
                    SYNAPSEOS
                  </div>
                  <div className="type-caption text-white/40">
                    Neural data platform
                  </div>
                </div>
              </Link>

              <div className="hidden items-center gap-7 lg:flex">
                {navItems.map((item) => (
                  <Link
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="group relative text-sm text-white/68 transition-colors duration-300 hover:text-white"
                  >
                    {item}
                    <span className="absolute inset-x-0 -bottom-2 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-300 to-violet-300 transition-transform duration-300 group-hover:scale-x-100" />
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="lg:hidden">
                  <Sheet>
                    <SheetTrigger
                      render={
                        <button className="flex size-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white transition hover:bg-white/[0.1]">
                          <Menu className="size-4" />
                        </button>
                      }
                    />
                    <SheetContent side="right" className="border-white/10 bg-[#07101f]/95 text-white">
                      <SheetHeader>
                        <SheetTitle className="text-white">SynapseOS</SheetTitle>
                        <SheetDescription className="text-white/55">
                          Navigate the product story and jump directly into the demo.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-8 flex flex-col gap-3">
                        {navItems.map((item) => (
                          <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/78 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            {item}
                          </Link>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                <a
                  href="/login"
                  className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white/78 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10 hover:text-white"
                >
                  Login
                </a>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "rounded-full border border-cyan-200/20 bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 px-5 text-slate-950 shadow-[0_0_40px_rgba(77,191,255,0.35)] transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.02]",
                  )}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.nav>
        </section>

        <section className="relative mx-auto grid w-full max-w-7xl gap-14 px-5 pb-20 pt-16 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:pt-24">
          <SectionReveal className="relative">
            <motion.div variants={fadeInUp} className="inline-flex">
              <Badge className="type-caption rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-cyan-100 shadow-[0_0_32px_rgba(0,190,255,0.18)]">
                Award-winning AI infrastructure experience
              </Badge>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-8 max-w-4xl">
              <h1 className="type-display text-5xl text-balance md:text-7xl xl:text-[5.7rem]">
                <span className="bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">
                  Next Generation Intelligent Database Management Platform
                </span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/60 md:text-xl">
                SynapseOS unifies observability, AI analytics, automation, and enterprise-grade
                control into one cinematic command layer for modern data teams.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "group rounded-full border border-cyan-200/20 bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 px-7 text-slate-950 shadow-[0_0_45px_rgba(77,191,255,0.34)] transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.02]",
                )}
              >
                Enter the control room
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#showcase"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full border-white/12 bg-white/5 px-7 text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white",
                )}
              >
                <Play className="size-4" />
                Watch overview
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Neural safeguards", value: "Zero-trust RBAC" },
                { label: "Predictive insights", value: "AI anomaly detection" },
                { label: "Mission uptime", value: "99.999% resilience" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl"
                >
                  <div className="type-caption text-white/40">
                    {item.label}
                  </div>
                  <div className="mt-3 text-base font-medium text-white/90">{item.value}</div>
                </div>
              ))}
            </motion.div>
          </SectionReveal>

          <SectionReveal className="relative flex min-h-[720px] items-center justify-center lg:min-h-[760px]">
            <motion.div
              animate={floatAnimation}
              className="absolute left-0 top-24 hidden w-52 rounded-[1.8rem] border border-cyan-300/15 bg-cyan-300/10 p-4 shadow-[0_0_40px_rgba(25,180,255,0.18)] backdrop-blur-2xl md:block"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-300/18">
                  <ShieldCheck className="size-5 text-cyan-100" />
                </div>
                <div>
                  <div className="text-sm font-medium">Security lattice</div>
                  <div className="text-xs text-white/45">RBAC synced globally</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{
                ...floatAnimation,
                transition: { ...floatAnimation.transition, duration: 7, delay: 0.4 },
              }}
              className="absolute bottom-20 right-2 hidden w-52 rounded-[1.8rem] border border-violet-300/15 bg-violet-300/10 p-4 shadow-[0_0_40px_rgba(150,90,255,0.18)] backdrop-blur-2xl md:block"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-violet-300/18">
                  <Radar className="size-5 text-violet-100" />
                </div>
                <div>
                  <div className="text-sm font-medium">Live anomaly scan</div>
                  <div className="text-xs text-white/45">0.3s detection latency</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="relative w-full max-w-[44rem] rounded-[2.4rem] border border-white/12 bg-white/[0.06] p-3 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-[24px]"
            >
              <div className="absolute -left-14 top-20 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
              <div className="absolute -right-12 bottom-16 h-44 w-44 rounded-full bg-violet-500/14 blur-3xl" />

              <div className="rounded-[2rem] border border-white/10 bg-[#090d1d]/90 p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="type-caption text-white/38">
                      SynapseOS Core
                    </div>
                    <div className="type-heading text-2xl">Autonomous Database Grid</div>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                    <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(78,245,168,0.8)]" />
                    Cluster Stable
                  </div>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.035] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white/45">Database health index</div>
                        <div className="type-metric mt-2 text-4xl">98.42</div>
                      </div>
                      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
                        +12.8%
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {[
                        { label: "Replication integrity", value: "94%" },
                        { label: "AI query optimizer", value: "88%" },
                        { label: "Transaction confidence", value: "99%" },
                      ].map((bar) => (
                        <div key={bar.label}>
                          <div className="mb-2 flex items-center justify-between text-sm text-white/55">
                            <span>{bar.label}</span>
                            <span>{bar.value}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/8">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: bar.value }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                              className="h-2 rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 shadow-[0_0_20px_rgba(74,200,255,0.45)]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.035] p-5">
                      <div className="text-sm text-white/45">AI recommendations</div>
                      <div className="mt-4 space-y-3">
                        {[
                          "Reroute write-heavy workloads to east cluster",
                          "Enable adaptive failover for finance namespace",
                          "Compress cold storage snapshots by 18%",
                        ].map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm leading-6 text-white/72"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-white/8 bg-gradient-to-br from-cyan-300/10 via-transparent to-violet-400/10 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-white/45">Incident drift</div>
                          <div className="mt-2 text-3xl font-semibold">-73%</div>
                        </div>
                        <Zap className="size-8 text-cyan-200" />
                      </div>
                      <p className="mt-4 text-sm leading-7 text-white/58">
                        Autonomous playbooks absorbed query spikes before customer impact.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {[
                    ["27", "Active automations"],
                    ["312ms", "Median response"],
                    ["6", "Protected regions"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="text-2xl font-semibold">{value}</div>
                      <div className="mt-1 text-sm text-white/44">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </SectionReveal>
        </section>

        <section id="platform" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-20">
          <SectionReveal>
            <motion.div variants={fadeInUp} className="mx-auto max-w-3xl text-center">
              <Badge className="type-caption rounded-full border border-white/12 bg-white/[0.06] px-4 py-1 text-white/58">
                Core capabilities
              </Badge>
              <h2 className="type-display mt-6 text-4xl md:text-6xl">
                Precision tools for high-trust data systems
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/58">
                Every feature is designed to feel fast, elegant, and deeply operational.
              </p>
            </motion.div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature) => (
                <motion.div key={feature.title} variants={fadeInUp}>
                  <Card className="group relative h-full overflow-hidden rounded-[2rem] border-white/10 bg-white/[0.055] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.07]">
                    <div
                      className={cn(
                        "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                        `bg-gradient-to-br ${feature.accent}`,
                      )}
                    />
                    <CardHeader className="relative pb-4">
                      <div className="mb-5 flex size-14 items-center justify-center rounded-[1.4rem] border border-white/12 bg-white/[0.07] shadow-[0_0_30px_rgba(255,255,255,0.04)]">
                        <feature.icon className="size-6 text-cyan-100" />
                      </div>
                      <CardTitle className="text-2xl text-white">{feature.title}</CardTitle>
                      <CardDescription className="text-base leading-7 text-white/58">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                      <div className="flex items-center gap-2 text-sm text-cyan-100/80">
                        Explore capability
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </SectionReveal>
        </section>

        <section id="solutions" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-20">
          <SectionReveal className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Counter
                key={stat.label}
                label={stat.label}
                value={stat.value}
                suffix={stat.suffix}
                prefix={stat.prefix}
              />
            ))}
          </SectionReveal>
        </section>

        <section id="showcase" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-20">
          <SectionReveal className="grid items-center gap-12 lg:grid-cols-[0.86fr_1.14fr]">
            <motion.div variants={fadeInUp}>
              <Badge className="type-caption rounded-full border border-violet-300/18 bg-violet-300/10 px-4 py-1 text-violet-100">
                Dashboard showcase
              </Badge>
              <h2 className="type-display mt-6 text-4xl md:text-6xl">
                A control plane built to feel cinematic under pressure
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/58">
                SynapseOS blends mission-critical telemetry with a calm, premium interface so
                operators can move faster without losing trust in the system.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  "Predictive cluster scoring with AI-generated remediation",
                  "Transaction heatmaps with role-aware audit visibility",
                  "Cross-region monitoring designed for SRE, security, and platform teams",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4"
                  >
                    <BadgeCheck className="mt-1 size-5 text-cyan-200" />
                    <p className="text-white/68">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="relative">
              <div className="absolute -inset-6 rounded-[2.6rem] bg-gradient-to-r from-cyan-400/18 via-transparent to-violet-500/18 blur-3xl" />
              <div className="relative rounded-[2.5rem] border border-white/12 bg-white/[0.05] p-4 backdrop-blur-2xl">
                <div className="rounded-[2rem] border border-white/10 bg-[#070b16]/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="type-caption text-white/40">
                        Global operations
                      </div>
                      <div className="type-heading mt-2 text-2xl">Telemetry Matrix</div>
                    </div>
                    <div className="flex gap-2">
                      {["North Virginia", "Frankfurt", "Singapore"].map((region) => (
                        <div
                          key={region}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55"
                        >
                          {region}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_0.78fr]">
                    <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-white/44">Live activity map</div>
                        <div className="text-sm text-cyan-100">+18% throughput</div>
                      </div>
                      <div className="mt-6 grid grid-cols-7 gap-2">
                        {Array.from({ length: 49 }).map((_, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0.25 }}
                            whileInView={{
                              opacity: 1,
                              scale: [1, 1.05, 1],
                            }}
                            viewport={{ once: true }}
                            transition={{
                              duration: 1.2,
                              delay: index * 0.012,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatDelay: 2.8,
                            }}
                            className={cn(
                              "aspect-square rounded-xl",
                              index % 5 === 0
                                ? "bg-cyan-300/70 shadow-[0_0_18px_rgba(86,220,255,0.5)]"
                                : index % 3 === 0
                                  ? "bg-violet-300/45"
                                  : "bg-white/[0.06]",
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
                        <div className="text-sm text-white/44">Automation queue</div>
                        <div className="mt-4 space-y-3">
                          {[
                            "Promote optimized indexes to production",
                            "Isolate high-noise tenant segment",
                            "Trigger forensic audit snapshot",
                          ].map((item) => (
                            <div
                              key={item}
                              className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/68"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[1.6rem] border border-white/8 bg-gradient-to-br from-cyan-300/10 to-violet-400/10 p-5">
                        <div className="text-sm text-white/44">Neural confidence</div>
                        <div className="type-metric mt-3 text-4xl">97.8%</div>
                        <p className="mt-3 text-sm leading-7 text-white/56">
                          Confidence score on automated decisions across live workload models.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </SectionReveal>
        </section>

        <section id="resources" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-20">
          <SectionReveal>
            <motion.div variants={fadeInUp} className="mx-auto max-w-3xl text-center">
              <Badge className="type-caption rounded-full border border-white/12 bg-white/[0.06] px-4 py-1 text-white/58">
                Testimonials
              </Badge>
              <h2 className="type-display mt-6 text-4xl md:text-6xl">
                Trusted by teams building the next decade of data products
              </h2>
            </motion.div>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <motion.div key={testimonial.name} variants={fadeInUp}>
                  <Card className="group h-full rounded-[2rem] border-white/10 bg-white/[0.05] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_60px_rgba(85,180,255,0.12)]">
                    <CardContent className="p-7">
                      <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.07]">
                        <Sparkles className="size-5 text-cyan-100" />
                      </div>
                      <p className="text-lg leading-8 text-white/72">&quot;{testimonial.quote}&quot;</p>
                      <div className="mt-8">
                        <div className="font-medium text-white">{testimonial.name}</div>
                        <div className="mt-1 text-sm text-white/45">{testimonial.role}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </SectionReveal>
        </section>

        <section id="pricing" className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-20">
          <SectionReveal>
            <motion.div variants={fadeInUp} className="mx-auto max-w-3xl text-center">
              <Badge className="type-caption rounded-full border border-cyan-300/18 bg-cyan-300/10 px-4 py-1 text-cyan-100">
                How SynapseOS Works
              </Badge>
              <h2 className="type-display mt-6 text-4xl md:text-6xl">
                A real enterprise workflow from request to operational visibility
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/58">
                Every action moves through authorization, transaction safety, analytics, reporting,
                and audit-grade observability so teams can trust the system end to end.
              </p>
            </motion.div>

            <div className="relative mt-14 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm md:p-7">
              <div className="pointer-events-none absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.08),transparent_30%)]" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:54px_54px]" />
              <div className="pointer-events-none absolute inset-0">
                {[0, 1, 2, 3, 4, 5].map((particle) => (
                  <motion.span
                    key={particle}
                    className="absolute size-1 rounded-full bg-cyan-200/65"
                    style={{
                      left: `${12 + particle * 14}%`,
                      top: `${18 + (particle % 3) * 22}%`,
                    }}
                    animate={{
                      x: [0, 10, -6, 0],
                      y: [0, -14, 8, 0],
                      opacity: [0.16, 0.55, 0.22, 0.16],
                      scale: [1, 1.25, 0.9, 1],
                    }}
                    transition={{
                      duration: 12 + particle * 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                      delay: particle * 0.4,
                    }}
                  />
                ))}
              </div>

              <div className="relative grid gap-6 xl:grid-cols-6 xl:gap-0">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === workflowSteps.length - 1;

                  return (
                    <motion.div
                      key={step.title}
                      variants={fadeInUp}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.65, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="relative xl:px-3"
                    >
                      <motion.div
                        whileHover={{ y: -6, rotateX: 1.5, rotateY: index % 2 === 0 ? -1.5 : 1.5 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        style={{ transformStyle: "preserve-3d" }}
                        className="group relative h-full rounded-[2rem] border border-white/10 bg-[rgba(8,15,30,0.72)] p-5 shadow-[0_0_20px_rgba(34,211,238,0.05)] transition-all duration-300 ease-out hover:border-cyan-300/20 hover:shadow-[0_0_28px_rgba(34,211,238,0.1)]"
                      >
                        <div className={cn("pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br opacity-80", step.accent)} />
                        <motion.div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 rounded-[2rem] border border-cyan-300/15"
                          animate={{ opacity: [0.18, 0.42, 0.18] }}
                          transition={{ duration: 5.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: index * 0.25 }}
                        />
                        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                        <motion.div
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 left-[-16%] w-14 -skew-x-[18deg] bg-gradient-to-r from-transparent via-cyan-200/14 to-transparent"
                          animate={{ x: ["0%", "420%"] }}
                          transition={{
                            duration: 8.5,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatDelay: 3.8 + index * 0.2,
                            ease: "easeInOut",
                          }}
                        />
                        <div className="relative">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex size-12 items-center justify-center rounded-[1.25rem] border border-cyan-300/18 bg-cyan-300/10 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
                              <Icon className="size-5 text-cyan-100" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="type-caption rounded-full border border-emerald-300/18 bg-emerald-300/10 px-2.5 py-1 text-emerald-100">
                                Live
                              </span>
                              <motion.span
                                className="size-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.35)]"
                                animate={{ scale: [1, 1.22, 1], opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: index * 0.15 }}
                              />
                            </div>
                          </div>

                          <div className="mt-5">
                            <div className="type-caption text-cyan-100/60">
                              Step {String(index + 1).padStart(2, "0")}
                            </div>
                            <h3 className="type-heading mt-3 text-xl text-white">
                              {step.title}
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-white/60">
                              {step.description}
                            </p>
                          </div>

                          <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-3">
                            <div className="type-caption text-white/35">Operational metadata</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {step.metadata.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/62"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/42">
                              <span>{step.detail}</span>
                              <span>t+{(index + 1) * 120}ms</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {!isLast ? (
                        <>
                          <div className="pointer-events-none absolute left-1/2 top-full z-10 hidden h-6 w-px -translate-x-1/2 bg-gradient-to-b from-cyan-300/40 to-transparent xl:hidden" />
                          <div className="pointer-events-none absolute right-[-10px] top-1/2 z-10 hidden h-px w-5 -translate-y-1/2 bg-gradient-to-r from-cyan-300/45 to-cyan-300/5 xl:block" />
                          <div className="pointer-events-none absolute right-[-4px] top-1/2 z-20 hidden size-2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.35)] xl:block" />
                          <motion.div
                            aria-hidden
                            className="pointer-events-none absolute right-[-18px] top-1/2 z-20 hidden h-[2px] w-10 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-300/0 via-cyan-200/70 to-cyan-300/0 xl:block"
                            animate={{ x: [-6, 14, -6], opacity: [0.28, 0.95, 0.28], scaleX: [0.8, 1.06, 0.8] }}
                            transition={{ duration: 3.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: index * 0.35 }}
                          />
                          <motion.div
                            aria-hidden
                            className="pointer-events-none absolute right-[-12px] top-1/2 z-20 hidden h-px w-12 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent xl:block"
                            animate={{ opacity: [0.08, 0.32, 0.08] }}
                            transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: index * 0.25 }}
                          />
                        </>
                      ) : null}
                    </motion.div>
                  );
                })}
              </div>

              <div className="relative mt-8 grid gap-4 rounded-[1.8rem] border border-white/10 bg-[rgba(8,15,30,0.74)] p-5 md:grid-cols-3">
                <div>
                  <div className="type-caption text-cyan-100/58">Transaction pulses</div>
                  <p className="mt-2 text-sm leading-7 text-white/58">
                    Every write path is validated, committed, and replay-safe before SynapseOS exposes results to operators.
                  </p>
                </div>
                <div>
                  <div className="type-caption text-cyan-100/58">Operational trust</div>
                  <p className="mt-2 text-sm leading-7 text-white/58">
                    Reports carry metrics, timestamps, ownership, and downstream notification routing so teams can audit every step.
                  </p>
                </div>
                <div>
                  <div className="type-caption text-cyan-100/58">Enterprise visibility</div>
                  <p className="mt-2 text-sm leading-7 text-white/58">
                    Judges can see the exact lifecycle from request to analytics to report delivery to audit logging in one surface.
                  </p>
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        <footer className="mx-auto mt-12 w-full max-w-7xl px-5 pb-12 pt-10 md:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-2xl">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                    <Orbit className="size-5 text-cyan-100" />
                  </div>
                  <div>
                    <div className="type-heading text-lg">SYNAPSEOS</div>
                    <div className="type-caption text-white/40">
                      Intelligent database management
                    </div>
                  </div>
                </div>
                <p className="mt-6 max-w-xl text-white/56">
                  Future-facing infrastructure software for the teams turning database operations
                  into a strategic advantage.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: "default", size: "lg" }),
                      "rounded-full border border-cyan-200/20 bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 text-slate-950",
                    )}
                  >
                    Start free
                  </a>
                  <Link
                    href="/dashboard"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "rounded-full border-white/12 bg-white/5 text-white hover:bg-white/10 hover:text-white",
                    )}
                  >
                    View dashboard
                  </Link>
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {footerColumns.map((column) => (
                  <div key={column.title}>
                    <div className="type-caption text-white/42">
                      {column.title}
                    </div>
                    <div className="mt-4 space-y-3">
                      {column.items.map((item) => (
                        <Link
                          key={item}
                          href="/"
                          className="block text-sm text-white/58 transition-colors duration-300 hover:text-white"
                        >
                          {item}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-white/8 pt-6 text-sm text-white/38 md:flex-row md:items-center md:justify-between">
              <p>(c) 2026 SynapseOS. Engineered for the next era of intelligent infrastructure.</p>
              <p>Built for teams that want cinematic clarity at production scale.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
