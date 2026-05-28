"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  Command,
  Eye,
  FileBarChart2,
  Gauge,
  LockKeyhole,
  Play,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCog,
  X,
  Zap,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNotificationCenter } from "@/components/providers/notification-center-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AiCommandCenterContext, NotificationCenterItem } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

type DemoExperienceProps = {
  context: AiCommandCenterContext;
  onExportLogs: () => void;
  onNavigate: (href: string) => void;
  onOpenCommand: () => void;
  role: UserRole;
};

type DemoEvent = {
  id: string;
  label: string;
  tone: "cyan" | "emerald" | "amber" | "rose";
  timestamp: string;
};

const demoSteps = [
  {
    label: "Landing page cinematic intro",
    detail: "Open the investor-ready product story.",
    href: "/",
    icon: Sparkles,
  },
  {
    label: "Login as Admin",
    detail: "Use seeded admin identity for full control.",
    href: "/login",
    icon: LockKeyhole,
  },
  {
    label: "Show RBAC system",
    detail: "Demonstrate admin-only user and role controls.",
    href: "/dashboard/users#rbac-control-center",
    icon: ShieldCheck,
  },
  {
    label: "Create report",
    detail: "Launch the DBMS-backed report workflow.",
    href: "/dashboard/reports#reports-workspace",
    icon: FileBarChart2,
  },
  {
    label: "AI insights generated",
    detail: "Open the AI Command Center and run a scan.",
    href: "__ai_scan__",
    icon: Bot,
  },
  {
    label: "Notification appears",
    detail: "Trigger a live operational notification.",
    href: "__notification__",
    icon: Radio,
  },
  {
    label: "Audit log updates",
    detail: "Jump to enterprise activity timeline.",
    href: "/dashboard/activity-logs",
    icon: Eye,
  },
  {
    label: "Switch roles",
    detail: "Show manager and user scoped surfaces.",
    href: "/dashboard/manager",
    icon: UserCog,
  },
  {
    label: "Restricted access",
    detail: "Show the premium unauthorized state.",
    href: "/unauthorized",
    icon: ShieldAlert,
  },
  {
    label: "Analytics + health",
    detail: "Close with metrics, system health, and AI posture.",
    href: "/dashboard/analytics",
    icon: Gauge,
  },
] as const;

const eventTone = {
  amber: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  cyan: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  rose: "border-rose-300/20 bg-rose-300/10 text-rose-100",
} as const;

function createDemoId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function formatDemoTime() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

export const DemoExperience = memo(function DemoExperience({
  context,
  onExportLogs,
  onNavigate,
  onOpenCommand,
  role,
}: DemoExperienceProps) {
  const { prependNotification } = useNotificationCenter();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [wowMoment, setWowMoment] = useState<string | null>(null);
  const [events, setEvents] = useState<DemoEvent[]>([
    {
      id: "demo-seed",
      label: "Demo mode armed · operational integrity verified",
      timestamp: "Now",
      tone: "emerald",
    },
  ]);

  useEffect(() => {
    document.documentElement.classList.toggle("synapse-presentation-mode", presentationMode);
    return () => document.documentElement.classList.remove("synapse-presentation-mode");
  }, [presentationMode]);

  useEffect(() => {
    if (!demoMode) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      const nextEvents: DemoEvent[] = [
        {
          id: createDemoId("demo-activity"),
          label: "Realtime metric heartbeat · transaction throughput synchronized",
          timestamp: formatDemoTime(),
          tone: "cyan",
        },
        {
          id: createDemoId("demo-audit"),
          label: "Audit stream updated · RBAC validation recorded",
          timestamp: formatDemoTime(),
          tone: "emerald",
        },
        {
          id: createDemoId("demo-alert"),
          label: "Anomaly scan finished · no privilege drift detected",
          timestamp: formatDemoTime(),
          tone: "amber",
        },
      ];
      const nextEvent = nextEvents[Math.floor(Math.random() * nextEvents.length)];
      setEvents((current) => [nextEvent, ...current].slice(0, 6));
    }, 6500);

    return () => window.clearInterval(interval);
  }, [demoMode]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const demoStats = useMemo(
    () => [
      {
        label: "Demo dataset",
        value: `${context.users.length + context.reports.length + context.activities.length}`,
      },
      {
        label: "Anomaly score",
        value: `${context.anomalyScore}`,
      },
      {
        label: "Throughput",
        value: `${context.throughput.toLocaleString("en-US")}`,
      },
    ],
    [context.activities.length, context.anomalyScore, context.reports.length, context.throughput, context.users.length],
  );

  const pushDemoNotification = useCallback((title: string, message: string, category: NotificationCenterItem["category"] = "Workflow") => {
    const notification: NotificationCenterItem = {
      actionLabel: "Open workspace",
      category,
      href: "/dashboard/notifications",
      id: createDemoId("demo-notification"),
      message,
      read: false,
      time: "Just now",
      title,
    };

    prependNotification(notification);
    pushToast({
      title,
      description: message,
      tone: category === "Security" ? "info" : "success",
    });
  }, [prependNotification, pushToast]);

  const showWowMoment = useCallback((message: string, tone: DemoEvent["tone"] = "cyan") => {
    setWowMoment(message);
    setEvents((current) => [
      {
        id: createDemoId("wow"),
        label: message,
        timestamp: formatDemoTime(),
        tone,
      },
      ...current,
    ].slice(0, 6));
    window.setTimeout(() => setWowMoment(null), 2400);
  }, []);

  const runDemoAction = useCallback((action: string) => {
    setDemoMode(true);

    if (action === "attack") {
      showWowMoment("AI anomaly detected · suspicious login blocked", "rose");
      pushDemoNotification(
        "Suspicious login blocked",
        "RBAC middleware rejected an unauthorized privileged route attempt.",
        "Security",
      );
      return;
    }

    if (action === "report") {
      showWowMoment("Report transaction committed · audit event written", "emerald");
      pushDemoNotification(
        "DBMS-backed report generated",
        "Report workflow persisted metrics, activity log, and notification metadata.",
      );
      onNavigate("/dashboard/reports#reports-workspace");
      return;
    }

    if (action === "anomaly") {
      showWowMoment("Latency spike detected · AI scan recommended optimization", "amber");
      pushDemoNotification(
        "Anomaly scan finished",
        "Latency increased 14%; SynapseOS recommends reviewing queued transactions.",
        "Incident",
      );
      return;
    }

    if (action === "notification") {
      showWowMoment("Live notification routed · unread badge synchronized", "cyan");
      pushDemoNotification(
        "Operational alert routed",
        "Notification center received a role-aware workflow event.",
      );
      return;
    }

    if (action === "escalate") {
      showWowMoment("Privilege escalation attempt captured · audit trail preserved", "rose");
      pushDemoNotification(
        "Privilege escalation logged",
        "Security center captured a role mutation attempt for review.",
        "Security",
      );
      onNavigate(role === "ADMIN" ? "/dashboard/users#rbac-control-center" : "/unauthorized");
      return;
    }

    showWowMoment("AI scan complete · operational integrity verified", "emerald");
    pushDemoNotification(
      "AI operational scan complete",
      "System health, audit stream, reports, and notifications were analyzed.",
    );
  }, [onNavigate, pushDemoNotification, role, showWowMoment]);

  const runStep = useCallback((index: number) => {
    const step = demoSteps[index];
    setActiveStep(index);
    setDemoMode(true);

    if (step.href === "__ai_scan__") {
      runDemoAction("scan");
      return;
    }

    if (step.href === "__notification__") {
      runDemoAction("notification");
      return;
    }

    onNavigate(step.href);
  }, [onNavigate, runDemoAction]);

  const runNextStep = useCallback(() => {
    const nextStep = Math.min(activeStep + 1, demoSteps.length - 1);
    runStep(nextStep);
  }, [activeStep, runStep]);

  return (
    <>
      <AnimatePresence>
        {wowMoment ? (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="fixed left-1/2 top-5 z-[80] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.6rem] border border-cyan-300/20 bg-[#081120]/98 p-4 text-white shadow-lg shadow-black/20"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                <Zap className="size-5" />
              </span>
              <div>
                <p className="type-caption text-cyan-100/70">WOW MOMENT</p>
                <p className="mt-1 font-medium text-white">{wowMoment}</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="fixed right-4 top-24 z-40 hidden xl:block">
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-cyan-300/20 bg-[#081120]/95 text-cyan-100 shadow-lg shadow-black/10 hover:bg-cyan-300/10 hover:text-cyan-50"
          onClick={() => setOpen((current) => !current)}
        >
          <Play className="size-4" />
          Demo Control
          <span className="type-mono rounded-full bg-cyan-300/10 px-2 py-1 text-[10px]">Ctrl Shift D</span>
        </Button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed right-4 top-24 z-[75] w-[min(440px,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-cyan-500/10 bg-[#081120]/98 text-white shadow-lg shadow-black/20"
          >
            <div className="border-b border-white/8 bg-gradient-to-r from-cyan-400/[0.08] to-blue-500/[0.04] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge className="rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                    Hackathon demo mode
                  </Badge>
                  <h2 className="type-heading mt-3 text-lg text-white">Judge-ready story flow</h2>
                  <p className="mt-1 text-sm leading-6 text-white/56">
                    Walk through RBAC, reports, AI insights, notifications, audit logs, and role restrictions.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {demoStats.map((stat) => (
                  <div key={stat.label} className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-xs text-white/42">{stat.label}</p>
                    <p className="type-mono mt-1 text-sm text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-xl bg-white text-black hover:bg-white/90"
                  onClick={() => {
                    setDemoMode(true);
                    setPresentationMode(true);
                    runStep(0);
                  }}
                >
                  <Play className="size-4" />
                  Start guided demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white",
                    presentationMode && "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
                  )}
                  onClick={() => setPresentationMode((current) => !current)}
                >
                  <Eye className="size-4" />
                  Presentation mode
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {demoSteps.map((step, index) => {
                  const Icon = step.icon;
                  const active = index === activeStep;

                  return (
                    <button
                      key={step.label}
                      type="button"
                      onClick={() => runStep(index)}
                      className={cn(
                        "w-full rounded-[1.2rem] border px-3 py-3 text-left transition duration-200",
                        active
                          ? "border-cyan-300/25 bg-cyan-300/[0.08] text-white"
                          : "border-white/8 bg-white/[0.03] text-white/68 hover:border-cyan-300/18 hover:bg-cyan-300/[0.05] hover:text-white",
                      )}
                    >
                      <div className="flex gap-3">
                        <span className={cn("flex size-9 items-center justify-center rounded-xl border", active ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-black/20 text-white/55")}>
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{index + 1}. {step.label}</span>
                          <span className="mt-1 block text-xs leading-5 text-white/45">{step.detail}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ["attack", "Simulate attack", ShieldAlert],
                  ["report", "Generate report", FileBarChart2],
                  ["anomaly", "Trigger anomaly", AlertTriangle],
                  ["notification", "Create notification", Radio],
                  ["escalate", "Escalate privileges", LockKeyhole],
                  ["scan", "Run AI scan", Bot],
                ].map(([action, label, Icon]) => (
                  <Button
                    key={action as string}
                    type="button"
                    variant="outline"
                    className="justify-start rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                    onClick={() => runDemoAction(action as string)}
                  >
                    <Icon className="size-4" />
                    {label as string}
                  </Button>
                ))}
              </div>

              <div className="mt-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="type-caption text-white/42">Live demo stream</p>
                  <Badge className={cn("rounded-full border", demoMode ? eventTone.emerald : eventTone.amber)}>
                    {demoMode ? "Live" : "Standby"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="rounded-[1rem] border border-white/8 bg-black/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-white/72">{event.label}</p>
                        <span className={cn("type-mono rounded-full border px-2 py-0.5 text-[10px]", eventTone[event.tone])}>
                          {event.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-cyan-400/18 bg-cyan-400/[0.05] text-cyan-100 hover:bg-cyan-400/10 hover:text-cyan-50"
                  onClick={runNextStep}
                >
                  Next step
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                  onClick={onOpenCommand}
                >
                  <Command className="size-4" />
                  Command menu
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                  onClick={onExportLogs}
                >
                  Export logs
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-emerald-400/18 bg-emerald-400/[0.05] text-emerald-100 hover:bg-emerald-400/10 hover:text-emerald-50"
                  onClick={() => runDemoAction("scan")}
                >
                  AI scan
                </Button>
              </div>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {presentationMode ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 top-0 z-[45] border-b border-cyan-300/10 bg-[#050816]/96 px-4 py-3 text-white shadow-lg shadow-black/10"
          >
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
              <div>
                <p className="type-caption text-cyan-100/70">Presentation mode</p>
                <p className="text-sm text-white/58">Reduced clutter · enhanced demo guidance · soundless micro-interactions</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                  System stable
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-white text-black hover:bg-white/90"
                  onClick={runNextStep}
                >
                  Next demo beat
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                  onClick={() => setPresentationMode(false)}
                >
                  Exit
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
});
