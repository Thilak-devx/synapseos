"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  Fingerprint,
  GitBranch,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@/lib/auth-schemas";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { getDefaultDashboardPathForRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type LoginFormProps = {
  callbackUrl: string;
};

const DEMO_CREDENTIALS = {
  ADMIN: { email: "admin@synapseos.dev", password: "admin123" },
  MANAGER: { email: "manager@synapseos.dev", password: "manager123" },
  USER: { email: "user@synapseos.dev", password: "user123" },
} as const;

const ADMIN_CACHE_KEY = "synapseos.demo-admin-credentials";
const ADMIN_REMEMBER_KEY = "synapseos.demo-admin-remember";
const IS_DEMO_PASSWORD_PERSISTENCE_ENABLED = process.env.NODE_ENV !== "production";

const ROLE_PRESENTATION = {
  ADMIN: {
    badge: "ADMIN ACCESS",
    tone: "border-rose-400/18 bg-[linear-gradient(180deg,rgba(38,11,20,0.82),rgba(14,20,38,0.82))]",
    accent: "from-rose-400/24 via-cyan-300/12 to-transparent",
    pill: "border-rose-300/20 bg-rose-300/10 text-rose-100",
    card:
      "border-rose-300/16 bg-[linear-gradient(180deg,rgba(36,11,20,0.72),rgba(9,18,36,0.78))] text-white hover:border-rose-300/28 hover:bg-[linear-gradient(180deg,rgba(42,13,24,0.8),rgba(10,22,40,0.82))]",
    active:
      "border-rose-300/28 bg-[linear-gradient(180deg,rgba(52,14,26,0.86),rgba(10,24,42,0.88))] text-white shadow-[0_0_28px_rgba(244,63,94,0.12),0_0_18px_rgba(34,211,238,0.08)]",
    icon: ShieldCheck,
    title: "Elevated infrastructure control",
    description:
      "Global analytics, role management, system metrics, audit visibility, and platform-wide operations.",
    capabilities: ["Full RBAC authority", "Global reports + exports", "Audit and system visibility"],
    sessionLabel: "Root-level enterprise scope",
    submitLabel: "Continue as administrator",
    transitionLabel: "Elevating secure admin session",
  },
  MANAGER: {
    badge: "MANAGER ROUTE",
    tone: "border-emerald-400/16 bg-[linear-gradient(180deg,rgba(10,24,24,0.82),rgba(10,18,36,0.82))]",
    accent: "from-emerald-400/20 via-cyan-300/10 to-transparent",
    pill: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    card:
      "border-emerald-300/14 bg-[linear-gradient(180deg,rgba(12,24,24,0.72),rgba(9,18,36,0.78))] text-white hover:border-emerald-300/22 hover:bg-[linear-gradient(180deg,rgba(14,28,28,0.8),rgba(10,22,40,0.82))]",
    active:
      "border-emerald-300/24 bg-[linear-gradient(180deg,rgba(14,30,30,0.86),rgba(10,24,42,0.88))] text-white shadow-[0_0_24px_rgba(52,211,153,0.1)]",
    icon: Waves,
    title: "Department operations scope",
    description:
      "Team analytics, department reporting, limited controls, and role-safe operational insight.",
    capabilities: ["Department analytics", "Team report generation", "Scoped team visibility"],
    sessionLabel: "Scoped operational permissions",
    submitLabel: "Continue as manager",
    transitionLabel: "Establishing scoped manager session",
  },
  USER: {
    badge: "USER WORKSPACE",
    tone: "border-cyan-400/14 bg-[linear-gradient(180deg,rgba(9,20,34,0.82),rgba(10,18,36,0.82))]",
    accent: "from-cyan-400/18 via-sky-300/10 to-transparent",
    pill: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    card:
      "border-cyan-300/12 bg-[linear-gradient(180deg,rgba(10,22,38,0.72),rgba(9,18,36,0.78))] text-white hover:border-cyan-300/22 hover:bg-[linear-gradient(180deg,rgba(11,24,42,0.8),rgba(10,22,40,0.82))]",
    active:
      "border-cyan-300/22 bg-[linear-gradient(180deg,rgba(12,26,44,0.86),rgba(10,24,42,0.88))] text-white shadow-[0_0_24px_rgba(34,211,238,0.1)]",
    icon: Fingerprint,
    title: "Personal workspace access",
    description:
      "Profile, personal reports, notifications, and user-safe dashboard controls.",
    capabilities: ["Own reports only", "Personal analytics", "Profile and notifications"],
    sessionLabel: "Personal workspace permissions",
    submitLabel: "Continue as user",
    transitionLabel: "Opening secure personal workspace",
  },
} as const;

function getDemoRoleForEmail(email: string | undefined) {
  const normalized = email?.trim().toLowerCase();

  return (Object.entries(DEMO_CREDENTIALS).find(
    ([, credentials]) => credentials.email === normalized,
  )?.[0] ?? null) as keyof typeof DEMO_CREDENTIALS | null;
}

function getInitialDemoState() {
  if (typeof window === "undefined") {
    return {
      role: "ADMIN" as const,
      email: DEMO_CREDENTIALS.ADMIN.email,
      password: DEMO_CREDENTIALS.ADMIN.password,
      rememberAdminSession: true,
      rememberEmail: true,
    };
  }

  const rememberAdminSession =
    window.localStorage.getItem(ADMIN_REMEMBER_KEY) !== "false";
  const rememberedEmail = window.localStorage.getItem("synapseos.remembered-email");
  const matchedRememberedRole = getDemoRoleForEmail(rememberedEmail ?? undefined);
  const persistedAdminCredentials =
    rememberAdminSession ? window.localStorage.getItem(ADMIN_CACHE_KEY) : null;

  if (persistedAdminCredentials) {
    try {
      const parsed = JSON.parse(persistedAdminCredentials) as {
        email?: string;
        password?: string;
        role?: "ADMIN";
      } | null;

      if (parsed?.role === "ADMIN" && parsed.email) {
        return {
          role: "ADMIN" as const,
          email: parsed.email,
          password:
            IS_DEMO_PASSWORD_PERSISTENCE_ENABLED && parsed.password
              ? parsed.password
              : DEMO_CREDENTIALS.ADMIN.password,
          rememberAdminSession,
          rememberEmail: true,
        };
      }
    } catch {
      window.localStorage.removeItem(ADMIN_CACHE_KEY);
    }
  }

  const fallbackRole = matchedRememberedRole ?? "ADMIN";

  return {
    role: fallbackRole,
    email: rememberedEmail ?? DEMO_CREDENTIALS[fallbackRole].email,
    password: DEMO_CREDENTIALS[fallbackRole].password,
    rememberAdminSession,
    rememberEmail: Boolean(rememberedEmail),
  };
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const initialDemoState = getInitialDemoState();
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "MANAGER" | "USER">(
    initialDemoState.role,
  );
  const [rememberMe, setRememberMe] = useState(initialDemoState.rememberEmail);
  const [rememberAdminSession] = useState(() => {
    return initialDemoState.rememberAdminSession;
  });
  const [invalidAttempt, setInvalidAttempt] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [successRole, setSuccessRole] = useState<"ADMIN" | "MANAGER" | "USER" | null>(null);
  const { pushToast } = useToast();

  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: initialDemoState.email,
      password: initialDemoState.password,
    },
  });

  const roleTheme = ROLE_PRESENTATION[selectedRole];
  const ActiveRoleIcon = roleTheme.icon;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      ADMIN_REMEMBER_KEY,
      rememberAdminSession ? "true" : "false",
    );
  }, [rememberAdminSession]);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      setInvalidAttempt(false);
      setSuccessRole(null);
      const response = await signIn("credentials", {
        ...values,
        role: selectedRole,
        redirect: false,
        callbackUrl,
      });

      if (!response || response.error) {
        setInvalidAttempt(true);
        window.setTimeout(() => setInvalidAttempt(false), 520);
        setError("root", {
          type: "manual",
          message: "Invalid email or password.",
        });
        pushToast({
          title: "Unable to sign in",
          description: "Double-check your credentials and try again.",
          tone: "error",
        });
        return;
      }

      const resolvedRole = selectedRole;

      if (typeof window !== "undefined") {
        if (rememberMe) {
          window.localStorage.setItem(
            "synapseos.remembered-email",
            values.email.trim().toLowerCase(),
          );
        } else {
          window.localStorage.removeItem("synapseos.remembered-email");
        }

        if (
          resolvedRole === "ADMIN" &&
          rememberAdminSession
        ) {
          window.localStorage.setItem(
            ADMIN_CACHE_KEY,
            JSON.stringify({
              role: "ADMIN",
              email: values.email.trim().toLowerCase(),
              password: IS_DEMO_PASSWORD_PERSISTENCE_ENABLED ? values.password : undefined,
            }),
          );
        } else {
          window.localStorage.removeItem(ADMIN_CACHE_KEY);
        }
      }

      setSuccessRole(resolvedRole);
      setLoginSuccess(true);
      pushToast({
        title: "Authentication successful",
        description:
          resolvedRole === "ADMIN"
            ? "Elevated admin session verified. Routing to the control plane."
            : "Routing you into the SynapseOS workspace.",
        tone: "success",
      });
      const roleDefaultPath = getDefaultDashboardPathForRole(resolvedRole);
      const requestedTarget =
        callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";
      const target = requestedTarget === "/dashboard" ? roleDefaultPath : requestedTarget;
      window.setTimeout(() => {
        window.location.assign(target);
      }, 720);
    });
  });

  return (
    <div className="relative">
      <motion.form
        className="space-y-5"
        onSubmit={onSubmit}
        animate={
          invalidAttempt
            ? { x: [0, -10, 10, -6, 6, 0] }
            : loginSuccess
              ? { scale: [1, 1.008, 1], opacity: [1, 0.96, 1] }
              : { x: 0, scale: 1, opacity: 1 }
        }
        transition={{ duration: invalidAttempt ? 0.34 : 0.24 }}
      >
      <div
        key={selectedRole}
        className={`relative overflow-hidden rounded-[1.7rem] border p-3.5 ${roleTheme.tone}`}
      >
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${roleTheme.accent} opacity-80`} />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="relative space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className={cn("type-caption inline-flex items-center gap-2 rounded-full border px-3 py-1.5", roleTheme.pill)}>
                {selectedRole === "ADMIN" ? (
                  <motion.span
                    className="size-2 rounded-full bg-rose-300"
                    animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.18, 1] }}
                    transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                ) : (
                  <motion.span
                    className="size-2 rounded-full bg-cyan-300"
                    animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.14, 1] }}
                    transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                )}
                {roleTheme.badge}
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <ActiveRoleIcon className={cn("size-5", selectedRole === "ADMIN" ? "text-rose-100" : selectedRole === "MANAGER" ? "text-emerald-100" : "text-cyan-100")} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
              <div className="type-caption text-white/40">Active target</div>
              <div className="mt-2 text-sm font-medium text-white">{selectedRole}</div>
            </div>
          </div>
          <div className="space-y-1.5">
            <h2 className="type-heading text-xl text-white">
              {selectedRole === "ADMIN" ? "Elevated system access" : selectedRole === "MANAGER" ? "Scoped operational access" : "Secure workspace access"}
            </h2>
            <p className="text-sm leading-6 text-white/60">
              {roleTheme.description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <h3 className="type-heading text-lg text-white">Login to SynapseOS</h3>
          <p className="mt-1.5 text-sm leading-6 text-white/56">
            Demo access is preconfigured.
          </p>
        </div>
      </div>

      <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.03] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="type-caption text-white/40">Role access target</p>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
            <Sparkles className="size-3.5" />
            Session hardening enabled
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          {(["ADMIN", "MANAGER", "USER"] as const).map((role) => {
            const credentials = DEMO_CREDENTIALS[role];
            const presentation = ROLE_PRESENTATION[role];
            const RoleIcon = presentation.icon;
            const isActive = selectedRole === role;

            return (
              <motion.div
                key={role}
                layout
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-auto min-h-[112px] w-full items-start justify-start rounded-[1.35rem] px-3.5 py-3.5 text-left",
                    presentation.card,
                    isActive && presentation.active,
                  )}
                  onClick={() => {
                    setSelectedRole(role);
                    setInvalidAttempt(false);
                    clearErrors("root");
                    setValue("email", credentials.email, { shouldDirty: true, shouldValidate: true });
                    setValue("password", credentials.password, { shouldDirty: true, shouldValidate: true });
                  }}
                >
                  <div className="flex w-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                        <RoleIcon className={cn("size-4", role === "ADMIN" ? "text-rose-100" : role === "MANAGER" ? "text-emerald-100" : "text-cyan-100")} />
                      </div>
                      {isActive ? (
                        <motion.span
                          layoutId="selected-role-pill"
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className={cn("type-caption rounded-full border px-2.5 py-1", presentation.pill)}
                        >
                          Active
                        </motion.span>
                      ) : null}
                    </div>
                    <div>
                      <div className="type-heading text-sm text-white">{role}</div>
                      <div className="mt-1.5 text-xs leading-5 text-white/56">
                        {presentation.sessionLabel}
                      </div>
                    </div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-white/78">Work email</span>
        <Input
          type="email"
          placeholder="admin@synapseos.dev"
          className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/32 transition focus:border-cyan-300/25 focus:bg-white/[0.07]"
          {...register("email")}
        />
        {errors.email ? <p className="text-sm text-rose-300">{errors.email.message}</p> : null}
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-white/78">Password</span>
        <PasswordInput
          placeholder="Enter your password"
          className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/32 transition focus:border-cyan-300/25 focus:bg-white/[0.07]"
          resetVisibilityKey={loginSuccess}
          {...register("password")}
        />
        {errors.password ? <p className="text-sm text-rose-300">{errors.password.message}</p> : null}
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-3 text-sm text-white/60">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="size-4 rounded border-white/15 bg-white/[0.05] accent-cyan-300"
            />
            Remember this email on this device
          </label>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {errors.root ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{errors.root.message}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Button
        type="submit"
        className="h-12 w-full rounded-full border border-cyan-200/20 bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 text-slate-950 shadow-[0_0_40px_rgba(82,176,255,0.3)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_56px_rgba(82,176,255,0.4)]"
        disabled={isPending}
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {loginSuccess ? roleTheme.transitionLabel : roleTheme.submitLabel}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-full border-white/10 bg-white/[0.04] text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white"
        onClick={() => signIn("github", { callbackUrl })}
      >
        <GitBranch className="size-4" />
        Continue with GitHub
      </Button>

      <p className="text-sm text-white/52">
        Need an account?{" "}
        <a href="/register" className="text-cyan-100 transition-colors hover:text-white">
          Create one
        </a>
      </p>
      </motion.form>

      <AnimatePresence>
        {loginSuccess && successRole ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(3,8,20,0.78)] backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex h-full flex-col items-center justify-center gap-4 px-8 text-center"
            >
              <motion.div
                className={cn(
                  "type-caption inline-flex items-center gap-2 rounded-full border px-4 py-2",
                  ROLE_PRESENTATION[successRole].pill,
                )}
                animate={{ opacity: [0.7, 1, 0.7], y: [0, -1, 0] }}
                transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <ShieldCheck className="size-4" />
                {ROLE_PRESENTATION[successRole].badge}
              </motion.div>
              <div className="space-y-2">
                <h3 className="type-heading text-2xl text-white">
                  {ROLE_PRESENTATION[successRole].transitionLabel}
                </h3>
                <p className="mx-auto max-w-md text-sm leading-7 text-white/60">
                  Verifying secure session posture, role scope, and protected route access before dashboard handoff.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/72">
                <LoaderCircle className="size-4 animate-spin" />
                Establishing trusted session
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
