"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  BadgeCheck,
  Bell,
  BellRing,
  Bot,
  Building2,
  ChartNoAxesCombined,
  ChevronRight,
  Command,
  FileBarChart2,
  History,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ServerCog,
  SlidersHorizontal,
  UserCog,
  UsersRound,
  LoaderCircle,
  Plus,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationCenterProvider, useNotificationCenter } from "@/components/providers/notification-center-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DemoExperience } from "@/features/dashboard/components/demo-experience";
import type { AiCommandCenterContext, NotificationCenterItem } from "@/features/dashboard/types";
import { getSidebarItemsForRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "chart-no-axes-combined": ChartNoAxesCombined,
  "users-round": UsersRound,
  "user-cog": UserCog,
  "file-bar-chart-2": FileBarChart2,
  "bell-ring": BellRing,
  "badge-check": BadgeCheck,
  "building-2": Building2,
  history: History,
  "server-cog": ServerCog,
  "sliders-horizontal": SlidersHorizontal,
} as const;

const AiCommandCenter = dynamic(
  () =>
    import("@/features/dashboard/components/ai-command-center").then(
      (module) => module.AiCommandCenter,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-4 right-4 z-[73]">
        <Button
          type="button"
          className="h-14 rounded-full border border-cyan-300/20 bg-gradient-to-r from-cyan-300 to-blue-500 px-5 text-slate-950 shadow-lg shadow-black/20"
          disabled
        >
          <Bot className="size-5" />
          AI Command
          <span className="type-mono rounded-full bg-black/15 px-2 py-1 text-[10px]">LOADING</span>
        </Button>
      </div>
    ),
  },
);

type DashboardShellProps = {
  aiContext: AiCommandCenterContext;
  children: React.ReactNode;
  currentPath: string;
  notifications: NotificationCenterItem[];
  role: UserRole;
  searchItems: Array<{
    category: string;
    description: string;
    href: string;
    id: string;
    keywords: string;
    label: string;
  }>;
  userEmail: string;
  userName: string;
};

function formatBreadcrumb(pathname: string) {
  const segments = pathname.split("/").filter(Boolean).slice(1);

  return [
    { label: "Dashboard", href: "/dashboard" },
    ...segments.map((segment, index) => ({
      label: segment.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()),
      href: `/dashboard/${segments.slice(0, index + 1).join("/")}`,
    })),
  ];
}

function isProfileDropdownItemActive(pathname: string, href: string) {
  if (href === "/dashboard/settings") {
    return pathname === href || pathname.includes("/settings/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getRoleTheme(role: UserRole) {
  if (role === "ADMIN") {
    return {
      badge: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
      surface: "Global controls enabled. This account can manage users, roles, infrastructure, and platform analytics.",
      shellLabel: "Admin surface",
      title: "SynapseOS Enterprise Control Plane",
      search: "Search users, reports, metrics...",
    };
  }

  if (role === "MANAGER") {
    return {
      badge: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
      surface: "Department analytics, assigned team visibility, and report management are available within your scope.",
      shellLabel: "Manager surface",
      title: "SynapseOS Department Operations",
      search: "Search team reports, activities...",
    };
  }

  return {
    badge: "border-violet-300/20 bg-violet-300/10 text-violet-100",
    surface: "Personal analytics, assigned reports, profile controls, and notifications are available for this account.",
    shellLabel: "User surface",
    title: "SynapseOS Personal Workspace",
    search: "Search reports, notifications...",
  };
}

const SidebarNav = memo(function SidebarNav({
  collapsed,
  role,
  userName,
}: {
  collapsed?: boolean;
  role: UserRole;
  userName: string;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const navItems = getSidebarItemsForRole(role);
  const theme = getRoleTheme(role);

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-cyan-500/10 bg-[#081120] p-4 shadow-lg shadow-black/10",
        collapsed ? "w-[92px]" : "w-full",
      )}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-300/15 to-transparent" />
      <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,#101827,#111827)] p-4 shadow-lg shadow-black/10">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <Command className="size-5 text-cyan-100" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="type-caption text-cyan-100/60">SynapseOS</p>
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
            </div>
          ) : null}
        </div>

        {!collapsed ? (
          <div className="mt-4 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-3">
            <Badge className={cn("type-caption rounded-full px-3 py-1", theme.badge)}>
              {role}
            </Badge>
            <p className="mt-3 text-xs leading-5 text-white/55">{theme.surface}</p>
          </div>
        ) : null}
      </div>

      <nav className="mt-6 space-y-2">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = iconMap[item.icon as keyof typeof iconMap];

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-[1.35rem] border px-3 py-3 transition-colors duration-200",
                  active
                    ? "border-cyan-400/20 bg-cyan-500/10 text-white shadow-sm shadow-cyan-950/20"
                    : "border-white/6 bg-[#0f172a] text-white/65 hover:border-cyan-400/20 hover:bg-[#111827] hover:text-white",
                )}
              >
                {active ? (
                  <>
                    <span className="absolute inset-0 rounded-[1.35rem] border border-cyan-300/20 bg-cyan-400/8" />
                    <span className="absolute bottom-3 left-2 top-3 w-1 rounded-full bg-cyan-300/85" />
                  </>
                ) : null}
                <span
                  className={cn(
                    "relative flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 transition-colors duration-200",
                    active && "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
                  )}
                >
                  <Icon className={cn("size-4 transition-colors duration-200", active ? "text-cyan-100" : "text-current group-hover:text-cyan-100")} />
                </span>
                {!collapsed ? (
                  <span className="relative min-w-0">
                    <span className={cn("type-body block text-sm font-medium transition-colors duration-300", active ? "text-white" : "text-current")}>{item.label}</span>
                    <span className={cn("block truncate text-xs transition-colors duration-300", active ? "text-white/60" : "text-white/40")}>{item.description}</span>
                  </span>
                ) : null}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <LogoutButton />
      </div>
    </div>
  );
});

function DashboardShellContent({
  aiContext,
  children,
  currentPath,
  role,
  searchItems,
  userEmail,
  userName,
}: Omit<DashboardShellProps, "notifications">) {
  const router = useRouter();
  const pathname = usePathname() ?? currentPath;
  const { pushToast } = useToast();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [isNotificationRouting, setIsNotificationRouting] = useState(false);
  const {
    notifications: syncedNotifications,
    unreadCount,
    selectedNotification,
    openNotification,
    closeNotification,
    markAllNotificationsRead,
  } = useNotificationCenter();
  const breadcrumbs = useMemo(() => formatBreadcrumb(pathname), [pathname]);
  const theme = getRoleTheme(role);
  const filteredSearchItems = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();

    if (!query) {
      return searchItems.slice(0, 10);
    }

    return searchItems
      .filter((item) =>
        [item.label, item.description, item.category, item.keywords]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 12);
  }, [commandQuery, searchItems]);
  const commandActions = useMemo(() => {
    const actions = [
      {
        category: "Action",
        description: "Launch the DBMS-backed report workflow.",
        href: "/dashboard/reports#reports-workspace",
        icon: Plus,
        id: "action-create-report",
        keywords: "create report generate transaction dbms",
        label: "Create report",
      },
      {
        category: "Navigation",
        description: "Open enterprise analytics and anomaly signals.",
        href: "/dashboard/analytics",
        icon: ChartNoAxesCombined,
        id: "action-open-analytics",
        keywords: "analytics metrics charts latency anomaly",
        label: "Open analytics",
      },
      {
        category: "Action",
        description: "Download audit and operational activity as JSON.",
        href: "__export_logs__",
        icon: History,
        id: "action-export-logs",
        keywords: "export logs audit activity security json",
        label: "Export logs",
      },
      {
        category: "Role view",
        description: "Open the dashboard view for your current role.",
        href: role === "ADMIN" ? "/dashboard/admin" : role === "MANAGER" ? "/dashboard/manager" : "/dashboard/user",
        icon: LayoutDashboard,
        id: "action-switch-role-view",
        keywords: "switch role dashboard admin manager user",
        label: `Switch to ${role.toLowerCase()} view`,
      },
    ];

    if (role === "ADMIN") {
      actions.splice(1, 0, {
        category: "Action",
        description: "Provision a new user from the Admin Control Center.",
        href: "/dashboard/users#rbac-control-center",
        icon: UserPlus,
        id: "action-create-user",
        keywords: "create user invite admin rbac role",
        label: "Create user",
      });
    }

    return actions;
  }, [role]);
  const filteredCommandActions = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();

    if (!query) {
      return commandActions;
    }

    return commandActions.filter((item) =>
      [item.label, item.description, item.category, item.keywords]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [commandActions, commandQuery]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleNotificationsOpenChange = useCallback(async (open: boolean) => {
    if (!open || unreadCount === 0) {
      return;
    }

    try {
      await markAllNotificationsRead();
    } catch (error) {
      pushToast({
        title: "Notification sync failed",
        description:
          error instanceof Error
            ? error.message
            : "We couldn't persist the notification read state.",
        tone: "error",
      });
    }
  }, [markAllNotificationsRead, pushToast, unreadCount]);

  const scrollToNotificationDestination = useCallback((href: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const hashIndex = href.indexOf("#");

    if (hashIndex === -1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const targetId = href.slice(hashIndex + 1);

    window.requestAnimationFrame(() => {
      const element = document.getElementById(targetId);

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        if (element instanceof HTMLElement) {
          element.focus({ preventScroll: true });
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }, []);

  const handleNotificationAction = useCallback(async (notification: NotificationCenterItem) => {
    const destination = notification.href;
    const [targetPathname] = destination.split("#");
    const sameRoute = (targetPathname || pathname) === pathname;

    setIsNotificationRouting(true);
    closeNotification();

    if (sameRoute) {
      scrollToNotificationDestination(destination);
      window.setTimeout(() => {
        setIsNotificationRouting(false);
      }, 320);
      return;
    }

    router.push(destination, {
      scroll: true,
      transitionTypes: ["notification-navigation"],
    });
    window.setTimeout(() => {
      setIsNotificationRouting(false);
    }, 420);
  }, [closeNotification, pathname, router, scrollToNotificationDestination]);

  const handleExportCommandLogs = useCallback(() => {
    const exportedAt = new Date().toISOString();
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt,
            exportedBy: userName,
            role,
            activities: aiContext.activities,
            notifications: aiContext.notifications,
            anomalyScore: aiContext.anomalyScore,
          },
          null,
          2,
        ),
      ],
      { type: "application/json;charset=utf-8" },
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `synapseos-command-center-logs-${exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    pushToast({
      title: "Audit synchronization complete",
      description: "Command Center exported operational activity and notification context.",
      tone: "success",
    });
  }, [aiContext.activities, aiContext.anomalyScore, aiContext.notifications, pushToast, role, userName]);

  const handleSearchNavigation = useCallback((href: string) => {
    setCommandOpen(false);
    setCommandQuery("");

    if (href === "__export_logs__") {
      handleExportCommandLogs();
      return;
    }

    router.push(href);
  }, [handleExportCommandLogs, router]);

  const handleOpenCommand = useCallback(() => {
    setCommandOpen(true);
  }, []);

  const handleAiNavigate = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <AnimatePresence>
        {isNotificationRouting ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-[70] bg-[#050816]/82"
          >
            <div className="flex h-full items-center justify-center">
              <div className="rounded-full border border-cyan-300/20 bg-[#0f172a] px-4 py-2 text-sm font-medium text-cyan-100 shadow-lg shadow-black/10">
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  Opening workspace
                </span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.12),rgba(2,6,23,0.42))]" />
      </div>
      <main className="relative z-10 flex min-h-screen gap-5 p-3 md:p-5 xl:p-6">
        <div className="hidden xl:block">
          <div className="transition-[width] duration-200 ease-out" style={{ width: desktopCollapsed ? 92 : 320 }}>
            <SidebarNav collapsed={desktopCollapsed} role={role} userName={userName} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="sticky top-0 z-30 overflow-hidden rounded-[2rem] border border-white/10 bg-[#081120]/95 px-4 py-4 shadow-lg shadow-black/10 md:px-5">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="xl:hidden">
                  <Sheet>
                    <SheetTrigger render={<Button variant="outline" size="icon" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white" />}>
                      <Menu className="size-4" />
                    </SheetTrigger>
                    <SheetContent side="left" className="border-white/10 bg-[#07101f]/95 p-0 text-white">
                      <SheetHeader className="px-4 py-5">
                        <SheetTitle className="text-white">SynapseOS navigation</SheetTitle>
                        <SheetDescription className="text-white/55">
                          Role-aware dashboard modules protected by middleware and session validation.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="px-4 pb-4">
                        <SidebarNav role={role} userName={userName} />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="hidden border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white xl:inline-flex"
                  onClick={() => setDesktopCollapsed((value) => !value)}
                >
                  {desktopCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                </Button>

                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                    <span className="type-caption rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">
                      {theme.shellLabel}
                    </span>
                    {breadcrumbs.map((crumb, index) => (
                      <div key={crumb.href} className="flex items-center gap-2">
                        {index > 0 ? <ChevronRight className="size-3" /> : null}
                        <Link href={crumb.href} className="transition hover:text-white">
                          {crumb.label}
                        </Link>
                      </div>
                    ))}
                  </div>
                  <h1 className="type-heading mt-2 text-xl text-white md:text-2xl">
                    {theme.title}
                  </h1>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1 sm:w-[320px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                  <Input
                    placeholder={theme.search}
                    className="h-11 rounded-2xl border-white/10 bg-black/25 pl-11 text-white placeholder:text-white/35 transition focus:border-cyan-300/25 focus:bg-black/35"
                    onFocus={() => setCommandOpen(true)}
                    readOnly
                  />
                </div>

                <div className="flex items-center gap-2">
                  <ThemeToggle className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white" />

                  <DropdownMenu onOpenChange={handleNotificationsOpenChange}>
                    <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="relative border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white" />}>
                      <Bell className="size-4" />
                      <AnimatePresence initial={false}>
                        {unreadCount > 0 ? (
                          <motion.span
                            key="notification-dot"
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.4 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="absolute right-2 top-2 size-2 rounded-full bg-cyan-300"
                          />
                        ) : null}
                      </AnimatePresence>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[360px] rounded-[1.5rem] border border-cyan-500/10 bg-[#0b1120] p-2 text-white shadow-lg shadow-black/10">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="px-3 pt-2 text-white/60">
                          Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ""}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/8" />
                        {syncedNotifications.map((item) => (
                          <DropdownMenuItem
                            key={item.id}
                            className={cn(
                              "cursor-pointer rounded-[1.2rem] px-3 py-3 text-white transition-colors duration-150 hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white",
                              !item.read && "border border-cyan-300/10 bg-cyan-300/[0.06]",
                            )}
                            onClick={() => {
                              void openNotification(item).catch((error) => {
                                pushToast({
                                  title: "Notification action failed",
                                  description:
                                    error instanceof Error
                                      ? error.message
                                      : "Unable to open this notification.",
                                  tone: "error",
                                });
                              });
                            }}
                          >
                            <div className="w-full">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium">{item.title}</span>
                                {!item.read ? (
                                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-cyan-100">
                                    New
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm leading-5 text-white/55">{item.message}</p>
                              <p className="type-caption mt-2 text-white/35">
                                {item.category} • {item.time}
                              </p>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" className="h-11 rounded-2xl border-white/10 bg-white/[0.04] px-2 text-white hover:bg-white/[0.08] hover:text-white" />}>
                      <Avatar size="sm" className="ring-1 ring-cyan-300/30">
                        <AvatarFallback className="bg-cyan-300/10 text-cyan-100">
                          {userName.split(" ").map((value) => value[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden text-left sm:block">
                        <span className="block text-sm font-medium">{userName}</span>
                        <span className="block text-xs text-white/45">{userEmail}</span>
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[240px] rounded-[1.5rem] border border-cyan-500/10 bg-[#0b1120] p-2 text-white shadow-lg shadow-black/10">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="px-3 pt-2 text-white/60">Signed in as {role}</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/8" />
                        <DropdownMenuItem
                          className={cn(
                            "group rounded-xl border px-3 py-2 text-white transition-all duration-200 focus:text-white",
                            isProfileDropdownItemActive(pathname, "/dashboard/profile")
                              ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200 focus:bg-cyan-500/10 focus:text-cyan-100"
                              : "border-transparent focus:bg-white/[0.06]",
                          )}
                        >
                          <Link href="/dashboard/profile" className="flex w-full items-center gap-3">
                            <span
                              className={cn(
                                "h-5 w-1 shrink-0 rounded-full transition-all duration-200",
                                isProfileDropdownItemActive(pathname, "/dashboard/profile")
                                  ? "bg-cyan-400"
                                  : "bg-white/10 group-hover:bg-cyan-400/40",
                              )}
                            />
                            Profile settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={cn(
                            "group rounded-xl border px-3 py-2 text-white transition-all duration-200 focus:text-white",
                            isProfileDropdownItemActive(pathname, "/dashboard/notifications")
                              ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200 focus:bg-cyan-500/10 focus:text-cyan-100"
                              : "border-transparent focus:bg-white/[0.06]",
                          )}
                        >
                          <Link href="/dashboard/notifications" className="flex w-full items-center gap-3">
                            <span
                              className={cn(
                                "h-5 w-1 shrink-0 rounded-full transition-all duration-200",
                                isProfileDropdownItemActive(pathname, "/dashboard/notifications")
                                  ? "bg-cyan-400"
                                  : "bg-white/10 group-hover:bg-cyan-400/40",
                              )}
                            />
                            Notification routing
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={cn(
                            "group rounded-xl border px-3 py-2 text-white transition-all duration-200 focus:text-white",
                            isProfileDropdownItemActive(pathname, "/dashboard/settings")
                              ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200 focus:bg-cyan-500/10 focus:text-cyan-100"
                              : "border-transparent focus:bg-white/[0.06]",
                          )}
                        >
                          <Link href="/dashboard/settings" className="flex w-full items-center gap-3">
                            <span
                              className={cn(
                                "h-5 w-1 shrink-0 rounded-full transition-all duration-200",
                                isProfileDropdownItemActive(pathname, "/dashboard/settings")
                                  ? "bg-cyan-400"
                                  : "bg-white/10 group-hover:bg-cyan-400/40",
                              )}
                            />
                            Security posture
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-w-0 flex-1 overflow-hidden rounded-[2rem] border border-cyan-500/10 bg-[#081120] p-4 shadow-lg shadow-black/10">
            <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
            {children}
          </div>
        </div>
      </main>

      <Dialog open={Boolean(selectedNotification)} onOpenChange={(open) => !open && closeNotification()}>
        <DialogContent className="max-w-xl rounded-[2rem] border border-cyan-500/10 bg-[#0b1120] p-0 text-white shadow-lg shadow-black/10">
          {selectedNotification ? (
            <>
              <DialogHeader className="border-b border-white/8 px-6 py-5">
                <div className="flex items-center gap-3">
                  <Badge className="rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                    {selectedNotification.category}
                  </Badge>
                  <span className="type-caption text-white/35">
                    {selectedNotification.time}
                  </span>
                </div>
                <DialogTitle className="type-heading text-xl text-white">{selectedNotification.title}</DialogTitle>
                <DialogDescription className="leading-7 text-white/60">
                  {selectedNotification.message}
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 py-5">
                <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="type-caption text-white/38">Interaction tracked</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    This notification has been marked as read and logged for realistic workspace interaction behavior.
                  </p>
                </div>
              </div>
              <DialogFooter className="border-white/8 bg-white/[0.02]" showCloseButton>
                <Button
                  className="rounded-full bg-white text-sm font-medium text-black hover:bg-white/90"
                  onClick={() => void handleNotificationAction(selectedNotification)}
                  disabled={isNotificationRouting}
                >
                  {isNotificationRouting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  {selectedNotification.actionLabel}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] border border-cyan-500/10 bg-[#0b1120] p-0 text-white shadow-lg shadow-black/10">
          <DialogHeader className="border-b border-white/8 px-6 py-5">
            <DialogTitle className="text-white">Command palette</DialogTitle>
            <DialogDescription className="text-white/58">
              Search users, reports, activity logs, departments, and notifications with Ctrl/Cmd + K.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <Input
              autoFocus
              value={commandQuery}
              onChange={(event) => setCommandQuery(event.target.value)}
              placeholder="Search users, reports, notifications, activity..."
              className="h-12 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-white/35 transition focus:border-cyan-300/25 focus:bg-black/35"
            />
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="type-caption text-white/42">Command actions</p>
                <span className="text-xs text-cyan-100/65">System stable</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredCommandActions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSearchNavigation(item.href)}
                      className="rounded-[1.25rem] border border-cyan-300/10 bg-cyan-300/[0.04] px-4 py-3 text-left transition hover:border-cyan-300/22 hover:bg-cyan-300/[0.08]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl border border-cyan-300/14 bg-cyan-300/8 text-cyan-100">
                          <Icon className="size-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-white">{item.label}</span>
                          <span className="block text-xs text-white/45">{item.description}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {filteredSearchItems.length ? (
                filteredSearchItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSearchNavigation(item.href)}
                    className="w-full rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:border-cyan-300/18 hover:bg-cyan-300/[0.07] hover:text-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{item.label}</p>
                      <span className="type-caption rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/45">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white/55">{item.description}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/52">
                  No matching workspace results.
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="border-white/8 bg-white/[0.02]">
            <div className="type-caption mr-auto text-white/35">
              Enter to navigate
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
              onClick={() => setCommandOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AiCommandCenter
        context={aiContext}
        onExportLogs={handleExportCommandLogs}
        onNavigate={handleAiNavigate}
        onOpenCommand={handleOpenCommand}
      />
      <DemoExperience
        context={aiContext}
        onExportLogs={handleExportCommandLogs}
        onNavigate={handleAiNavigate}
        onOpenCommand={handleOpenCommand}
        role={role}
      />
    </div>
  );
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <NotificationCenterProvider initialNotifications={props.notifications}>
      <DashboardShellContent {...props} />
    </NotificationCenterProvider>
  );
}
