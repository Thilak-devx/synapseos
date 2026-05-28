"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BellRing,
  Bot,
  BrainCircuit,
  Command,
  Cpu,
  FileText,
  Gauge,
  LockKeyhole,
  Radar,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AiCommandCenterContext } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

type AiCommandCenterProps = {
  context: AiCommandCenterContext;
  onExportLogs: () => void;
  onNavigate: (href: string) => void;
  onOpenCommand: () => void;
};

type AiMessage = {
  id: string;
  content: string;
  role: "assistant" | "user";
  timestamp: string;
};

type QuickAction = {
  icon: typeof Gauge;
  label: string;
  prompt: string;
};

const quickActions: QuickAction[] = [
  { icon: Gauge, label: "Analyze system health", prompt: "Analyze system health" },
  { icon: LockKeyhole, label: "Show active threats", prompt: "Show active threats" },
  { icon: FileText, label: "Generate audit summary", prompt: "Generate audit summary" },
  { icon: Radar, label: "Detect anomalies", prompt: "Detect anomalies" },
  { icon: Cpu, label: "Explain database load", prompt: "Explain database load" },
  { icon: UsersRound, label: "Summarize user activity", prompt: "Summarize user activity" },
  { icon: ShieldCheck, label: "Review RBAC permissions", prompt: "Review RBAC permissions" },
  { icon: BarChart3, label: "Generate executive report", prompt: "Generate executive report" },
];

const stateTone = {
  Attention: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  Monitoring: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  Stable: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
} as const;

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatMessageTime() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function getHealthValue(context: AiCommandCenterContext, label: string, fallback: string) {
  return context.health.find((item) => item.label === label)?.value ?? fallback;
}

function buildAssistantResponse(prompt: string, context: AiCommandCenterContext) {
  const normalizedPrompt = prompt.toLowerCase();
  const activeUsers = context.users.filter((user) => user.status === "Active").length;
  const suspendedUsers = context.users.filter((user) => user.status === "Suspended").length;
  const criticalEvents = context.activities.filter((activity) => activity.severity === "Critical");
  const warningEvents = context.activities.filter((activity) => activity.severity === "Warning");
  const completedReports = context.reports.filter((report) => report.status === "Completed");
  const queuedReports = context.reports.filter((report) => report.status === "Queued" || report.status === "Processing");
  const failedReports = context.reports.filter((report) => report.status === "Failed");
  const unreadNotifications = context.notifications.filter((notification) => !notification.read);
  const exportEvents = context.activities.filter((activity) => activity.action.toLowerCase().includes("export"));
  const roleEvents = context.activities.filter((activity) => activity.action.toLowerCase().includes("role"));
  const dbHealth = getHealthValue(context, "DB health", "98%");
  const uptime = getHealthValue(context, "Uptime", "99.982%");
  const replication = getHealthValue(context, "Replication", "Synced");
  const queueDepth = getHealthValue(context, "Queue depth", `${queuedReports.length}`);
  const anomalyScore = getHealthValue(context, "Anomaly score", `${context.anomalyScore}`);
  const topInsight = context.insights[0];

  if (context.role === "MANAGER") {
    if (normalizedPrompt.includes("health") || normalizedPrompt.includes("executive") || normalizedPrompt.includes("activity")) {
      return `Department operations summary:

Team efficiency improved 6% across the current operating window.
Assigned reports in scope: ${context.reports.length}.
Active team signals: ${context.activities.length}.
Unread department notifications: ${unreadNotifications.length}.

No global admin controls are exposed in this workspace. Recommended action: review queued team reports and unblock any warning-level activity.`;
    }

    if (normalizedPrompt.includes("rbac") || normalizedPrompt.includes("permission") || normalizedPrompt.includes("security")) {
      return `Manager RBAC posture:

You can create and manage department reports, view team analytics, and monitor assigned team activity.
You cannot assign admin roles, delete users, access platform-wide audit logs, or inspect global system metrics.

Department access boundary is intact.`;
    }
  }

  if (context.role === "USER") {
    if (normalizedPrompt.includes("health") || normalizedPrompt.includes("executive") || normalizedPrompt.includes("activity") || normalizedPrompt.includes("report")) {
      return `Personal workspace summary:

You completed ${completedReports.length} report(s) this cycle.
You have ${unreadNotifications.length} personal notification(s) awaiting review.
Your visible activity scope contains ${context.activities.length} personal event(s).

No admin analytics, RBAC controls, team management, or system monitoring are available in this role.`;
    }

    if (normalizedPrompt.includes("rbac") || normalizedPrompt.includes("permission") || normalizedPrompt.includes("security")) {
      return `User access review:

Your permissions are limited to personal dashboard, personal reports, notifications, profile, and account settings.
Attempts to access admin users, system metrics, global analytics, or audit logs are redirected by middleware.

Personal access boundary verified.`;
    }
  }

  if (normalizedPrompt.includes("system health") || normalizedPrompt.includes("health")) {
    return `System integrity remains stable at ${uptime}.

DB health is currently ${dbHealth}, replication is ${replication}, and queue depth is ${queueDepth}. Query pressure is within the monitored operating envelope, with anomaly score ${anomalyScore}. ${criticalEvents.length ? `${criticalEvents.length} critical event(s) require review.` : "No critical anomalies detected."}`;
  }

  if (normalizedPrompt.includes("threat") || normalizedPrompt.includes("suspicious") || normalizedPrompt.includes("security")) {
    return criticalEvents.length || warningEvents.length
      ? `Security posture is guarded. I found ${criticalEvents.length} critical and ${warningEvents.length} warning event(s).

Most relevant signal: ${criticalEvents[0]?.actor ?? warningEvents[0]?.actor} ${criticalEvents[0]?.action ?? warningEvents[0]?.action} on ${criticalEvents[0]?.resource ?? warningEvents[0]?.resource}.

Recommended action: review audit logs, validate active sessions, and confirm RBAC assignments.`
      : `No active threats detected. RBAC validation is enforced, session posture is stable, and audit synchronization is complete. Suspended accounts: ${suspendedUsers}.`;
  }

  if (normalizedPrompt.includes("audit")) {
    return `Audit summary generated.

Events analyzed: ${context.activities.length}.
Role mutation signals: ${roleEvents.length}.
Report export events: ${exportEvents.length}.
Unread operational notifications: ${unreadNotifications.length}.

Audit trail is preserved and ready for export.`;
  }

  if (normalizedPrompt.includes("anomal")) {
    return `Anomaly detection completed.

Current anomaly score: ${context.anomalyScore}/100.
Failed reports: ${failedReports.length}.
Queued workflows: ${queuedReports.length}.
Security warnings: ${warningEvents.length}.

${context.anomalyScore > 45 ? "Recommendation: inspect queued transactions and recent export activity." : "No abnormal operational drift detected."}`;
  }

  if (normalizedPrompt.includes("database") || normalizedPrompt.includes("load") || normalizedPrompt.includes("latency")) {
    return `Database load explanation:

Throughput is ${context.throughput.toLocaleString("en-US")} operations.
DB health reads ${dbHealth}.
Queue depth is ${queueDepth}.
Replication status is ${replication}.

The current load appears ${context.anomalyScore > 45 ? "elevated but contained" : "stable"}. If latency rises, prioritize queued report transactions and notification processing.`;
  }

  if (normalizedPrompt.includes("user activity") || normalizedPrompt.includes("users")) {
    return `User activity summary:

Active users: ${activeUsers}.
Suspended users: ${suspendedUsers}.
Recent activity records: ${context.activities.length}.
Role events detected: ${roleEvents.length}.

The workspace is operating with ${context.role} scope and no evidence of broad identity drift.`;
  }

  if (normalizedPrompt.includes("rbac") || normalizedPrompt.includes("permission")) {
    return `RBAC review:

Current view: ${context.role}.
Admin actions are isolated behind server-side route guards and API checks.
Role mutation events observed: ${roleEvents.length}.
Suspended accounts: ${suspendedUsers}.

Recommendation: keep role changes audited and periodically export privileged activity logs.`;
  }

  if (normalizedPrompt.includes("executive") || normalizedPrompt.includes("report") || normalizedPrompt.includes("summarize")) {
    return `Executive operations report:

${completedReports.length} completed report(s), ${queuedReports.length} queued workflow(s), and ${failedReports.length} failed report(s).
Platform uptime: ${uptime}.
Database health: ${dbHealth}.
Anomaly score: ${context.anomalyScore}.

Narrative: ${topInsight?.title ?? "Operational integrity verified"} — ${topInsight?.description ?? "No urgent anomalies detected."}`;
  }

  return `${topInsight?.title ?? "SynapseOS is stable"}.

${topInsight?.description ?? "The command center found no urgent anomalies."}

Current throughput is ${context.throughput.toLocaleString("en-US")} operations, with ${completedReports.length} completed reports and anomaly score ${context.anomalyScore}.`;
}

export const AiCommandCenter = memo(function AiCommandCenter({
  context,
  onExportLogs,
  onNavigate,
  onOpenCommand,
}: AiCommandCenterProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>(() => [
    {
      id: "assistant-welcome",
      content: "SynapseOS Copilot is live. I can analyze system health, explain database load, summarize audit events, and recommend operational actions from the current dashboard context.",
      role: "assistant",
      timestamp: formatMessageTime(),
    },
  ]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [tick, setTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((current) => (current + 1) % 1000);
    }, 4800);

    return () => window.clearInterval(interval);
  }, []);

  const liveContext = useMemo<AiCommandCenterContext>(() => {
    const drift = tick % 7;
    const anomalyScore = Math.min(88, Math.max(8, context.anomalyScore + (drift % 2 === 0 ? drift : -drift)));
    const throughput = Math.max(1, context.throughput + drift * 37);

    return {
      ...context,
      anomalyScore,
      health: context.health.map((item) => {
        if (item.label === "Anomaly score") {
          return {
            ...item,
            state: anomalyScore > 55 ? "Attention" : anomalyScore > 38 ? "Monitoring" : "Stable",
            value: `${anomalyScore}`,
          };
        }

        if (item.label === "Queue depth") {
          return {
            ...item,
            state: drift > 4 ? "Monitoring" : item.state,
            value: `${Number.parseInt(item.value, 10) + (drift % 3) || drift + 2}`,
          };
        }

        if (item.label === "DB health") {
          const base = Number.parseInt(item.value, 10) || 98;
          return {
            ...item,
            state: anomalyScore > 55 ? "Monitoring" : item.state,
            value: `${Math.min(99, Math.max(91, base - (drift % 3)))}%`,
          };
        }

        return item;
      }),
      throughput,
    };
  }, [context, tick]);

  useEffect(() => {
    if (!open) {
      return;
    }

    window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        behavior: "smooth",
        top: scrollRef.current.scrollHeight,
      });
    });
  }, [messages, open]);

  const dynamicInsights = useMemo(() => {
    const queueDepth = getHealthValue(liveContext, "Queue depth", "0");
    const storageSignal = getHealthValue(liveContext, "DB health", "98%");
    const exportActivity = liveContext.activities.filter((activity) =>
      activity.action.toLowerCase().includes("export"),
    ).length;
    const managerActivity = liveContext.activities.filter((activity) =>
      activity.actor.toLowerCase().includes("manager") || activity.resource.toLowerCase().includes("department"),
    ).length;

    return [
      {
        title: `Latency ${liveContext.anomalyScore > 45 ? "increased" : "stable"}`,
        description: liveContext.anomalyScore > 45 ? "Anomaly scan recommends reviewing queued operations." : "Query response remains inside the normal operating envelope.",
        stat: liveContext.anomalyScore > 45 ? "+14%" : "OK",
      },
      {
        title: "Storage threshold",
        description: `Database health currently reads ${storageSignal}.`,
        stat: storageSignal,
      },
      {
        title: "Export activity",
        description: exportActivity ? "Unusual export activity detected in the audit stream." : "No unusual export spike detected.",
        stat: `${exportActivity}`,
      },
      {
        title: "Manager activity",
        description: managerActivity ? "Department operations are elevated this cycle." : "Department activity is within baseline.",
        stat: `${managerActivity}`,
      },
      {
        title: "Queue depth",
        description: "Pending report and notification workflows.",
        stat: queueDepth,
      },
    ];
  }, [liveContext]);

  const liveActivities = useMemo(
    () =>
      liveContext.activities.slice(0, 5).map((activity, index) => ({
        ...activity,
        live: (tick + index) % 3 === 0,
      })),
    [liveContext.activities, tick],
  );

  const streamAssistantMessage = useCallback((content: string) => {
    const assistantId = createMessageId("assistant");
    setStreamingMessageId(assistantId);
    setThinking(true);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: assistantId,
          content: "",
          role: "assistant",
          timestamp: formatMessageTime(),
        },
      ]);
      setThinking(false);

      let index = 0;
      const stream = window.setInterval(() => {
        index += Math.max(3, Math.ceil(content.length / 42));
        const nextContent = content.slice(0, index);

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, content: nextContent } : message,
          ),
        );

        if (index >= content.length) {
          window.clearInterval(stream);
          setStreamingMessageId(null);
        }
      }, 28);
    }, 360);
  }, []);

  const submitPrompt = useCallback((nextPrompt = prompt) => {
    const trimmedPrompt = nextPrompt.trim();

    if (!trimmedPrompt || thinking || streamingMessageId) {
      return;
    }

    setPrompt("");
    setMessages((current) => [
      ...current,
      {
        id: createMessageId("user"),
        content: trimmedPrompt,
        role: "user",
        timestamp: formatMessageTime(),
      },
    ]);
    streamAssistantMessage(buildAssistantResponse(trimmedPrompt, liveContext));
  }, [liveContext, prompt, streamAssistantMessage, streamingMessageId, thinking]);

  return (
    <>
      <aside className="pointer-events-none fixed bottom-4 left-4 z-40 hidden w-[330px] lg:block">
        <div className="pointer-events-auto rounded-[1.35rem] border border-cyan-500/10 bg-[#081120]/95 p-3 shadow-lg shadow-black/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="type-caption text-cyan-100/70">System health overlay</p>
              <p className="mt-1 text-sm text-white/55">Operational integrity verified</p>
            </div>
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full rounded-full bg-emerald-300/40 opacity-75 [animation:pulse_2.4s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
              <span className="relative inline-flex size-3 rounded-full bg-emerald-300" />
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {liveContext.health.slice(0, 6).map((item) => (
              <div key={item.label} className="rounded-[0.9rem] border border-white/8 bg-white/[0.03] p-2.5">
                <p className="text-xs text-white/42">{item.label}</p>
                <p className="type-mono mt-1 text-sm text-white">{item.value}</p>
                <Badge className={cn("mt-2 rounded-full border text-[10px]", stateTone[item.state])}>
                  {item.state}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[72] bg-black/35 md:bg-black/20"
            onClick={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 z-[73] flex flex-col items-end gap-3">
        <AnimatePresence>
          {open ? (
            <motion.section
              initial={{ opacity: 0, x: 28, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 28, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="fixed inset-x-3 bottom-20 top-3 flex overflow-hidden rounded-[2rem] border border-cyan-500/10 bg-[#07101f]/98 text-white shadow-lg shadow-black/25 md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:w-[min(520px,calc(100vw-2rem))]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex min-h-0 w-full flex-col">
                <header className="border-b border-white/8 bg-gradient-to-r from-cyan-400/[0.08] to-blue-500/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                          <Sparkles className="size-3" />
                          AI Command Center
                        </Badge>
                        <Badge className="rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                          <span className="mr-1 size-1.5 rounded-full bg-emerald-300" />
                          LIVE
                        </Badge>
                      </div>
                      <h2 className="type-heading mt-3 text-lg text-white">SynapseOS Copilot</h2>
                      <p className="mt-1 text-sm leading-6 text-white/56">
                        Context-aware enterprise operations assistant for reports, RBAC, audit logs, users, metrics, and system health.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                      onClick={() => setOpen(false)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ["Health", getHealthValue(liveContext, "DB health", "98%")],
                      ["Anomaly", `${liveContext.anomalyScore}`],
                      ["Ops", liveContext.throughput.toLocaleString("en-US")],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-2.5">
                        <p className="text-xs text-white/42">{label}</p>
                        <p className="type-mono mt-1 text-sm text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </header>

                <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => submitPrompt(action.prompt)}
                          disabled={thinking || Boolean(streamingMessageId)}
                          className="rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-3 py-2 text-left text-sm text-white/68 transition duration-200 hover:border-cyan-300/20 hover:bg-cyan-300/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="size-4 text-cyan-100" />
                            {action.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[88%] rounded-[1.25rem] border px-4 py-3",
                            message.role === "user"
                              ? "border-cyan-300/18 bg-cyan-300/[0.08] text-cyan-50"
                              : "border-white/8 bg-white/[0.035] text-white/72",
                          )}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            {message.role === "assistant" ? (
                              <BrainCircuit className="size-4 text-cyan-100" />
                            ) : (
                              <Command className="size-4 text-cyan-100" />
                            )}
                            <span className="type-caption text-white/35">
                              {message.role === "assistant" ? "SynapseOS AI" : "Operator"} · {message.timestamp}
                            </span>
                          </div>
                          <p className="whitespace-pre-line text-sm leading-7">
                            {message.content}
                            {streamingMessageId === message.id ? (
                              <span className="ml-1 inline-block h-4 w-1 translate-y-0.5 bg-cyan-200 [animation:pulse_1s_ease-in-out_infinite]" />
                            ) : null}
                          </p>
                        </div>
                      </div>
                    ))}
                    {thinking ? (
                      <div className="flex justify-start">
                        <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.035] px-4 py-3 text-white/72">
                          <div className="flex items-center gap-2 text-sm">
                            <Radar className="size-4 animate-spin text-cyan-100" />
                            Thinking across metrics, reports, audit logs, and RBAC state
                            <span className="flex gap-1">
                              <span className="size-1.5 rounded-full bg-cyan-200 [animation:pulse_1s_ease-in-out_infinite]" />
                              <span className="size-1.5 rounded-full bg-cyan-200 [animation:pulse_1s_ease-in-out_infinite_120ms]" />
                              <span className="size-1.5 rounded-full bg-cyan-200 [animation:pulse_1s_ease-in-out_infinite_240ms]" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Cpu className="size-4 text-cyan-100" />
                        <p className="type-caption text-white/45">Context signals</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {dynamicInsights.slice(0, 4).map((insight) => (
                          <div key={insight.title} className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-white">{insight.title}</p>
                              <span className="type-mono text-xs text-cyan-100">{insight.stat}</span>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-white/48">{insight.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Activity className="size-4 text-cyan-100" />
                        <p className="type-caption text-white/45">Live activity context</p>
                      </div>
                      <div className="space-y-2">
                        {liveActivities.map((activity) => (
                          <div key={activity.id} className="flex gap-3 rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
                            <span className={cn("mt-1 size-2.5 rounded-full", activity.live ? "bg-cyan-300" : "bg-white/22")} />
                            <div className="min-w-0">
                              <p className="truncate text-sm text-white">
                                {activity.actor} <span className="text-white/45">{activity.action}</span>
                              </p>
                              <p className="mt-1 truncate text-xs text-white/42">{activity.resource} · {activity.timestamp}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <footer className="border-t border-white/8 bg-[#081120] p-4">
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submitPrompt();
                    }}
                  >
                    <Input
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      className="h-11 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-white/35 focus:border-cyan-300/25"
                      placeholder="Ask SynapseOS about operations..."
                    />
                    <Button
                      type="submit"
                      className="h-11 rounded-2xl bg-white text-black hover:bg-white/90"
                      disabled={thinking || Boolean(streamingMessageId)}
                    >
                      {thinking || streamingMessageId ? <Radar className="size-4 animate-spin" /> : <Send className="size-4" />}
                    </Button>
                  </form>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Button type="button" variant="outline" className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white" onClick={onOpenCommand}>
                      <Command className="size-4" />
                      Ctrl K
                    </Button>
                    <Button type="button" variant="outline" className="rounded-xl border-cyan-400/18 bg-cyan-400/[0.05] text-cyan-100 hover:bg-cyan-400/10 hover:text-cyan-50" onClick={() => onNavigate("/dashboard/analytics")}>
                      <Radar className="size-4" />
                      Analytics
                    </Button>
                    <Button type="button" variant="outline" className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white" onClick={onExportLogs}>
                      <BellRing className="size-4" />
                      Logs
                    </Button>
                    <Button type="button" variant="outline" className="rounded-xl border-emerald-400/18 bg-emerald-400/[0.05] text-emerald-100 hover:bg-emerald-400/10 hover:text-emerald-50" onClick={() => onNavigate(context.role === "ADMIN" ? "/dashboard/users#rbac-control-center" : "/dashboard/reports")}>
                      <ShieldCheck className="size-4" />
                      {context.role === "ADMIN" ? "RBAC" : "Reports"}
                    </Button>
                  </div>
                </footer>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        <Button
          type="button"
          className="h-14 rounded-full border border-cyan-300/20 bg-gradient-to-r from-cyan-300 to-blue-500 px-5 text-slate-950 shadow-lg shadow-black/20 transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-110"
          onClick={() => setOpen((current) => !current)}
        >
          <Bot className="size-5" />
          AI Command
          <span className="type-mono rounded-full bg-black/15 px-2 py-1 text-[10px]">LIVE</span>
        </Button>
      </div>
    </>
  );
});
