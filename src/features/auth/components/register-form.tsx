"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { registerSchema, type RegisterInput } from "@/lib/auth-schemas";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const [successKey, setSuccessKey] = useState(0);
  const { pushToast } = useToast();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError("root", {
          type: "manual",
          message: payload?.error ?? "Unable to create your account.",
        });
        pushToast({
          title: "Registration failed",
          description: payload?.error ?? "Please review your inputs and try again.",
          tone: "error",
        });
        return;
      }

      pushToast({
        title: "Account created",
        description: "Your workspace access is ready. Signing you in now.",
        tone: "success",
      });
      setSuccessKey((current) => current + 1);

      const signInResponse = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (!signInResponse || signInResponse.error) {
        window.location.assign("/login");
        return;
      }

      window.location.assign("/dashboard");
    });
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-3">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-300/10">
          <ShieldCheck className="size-5 text-violet-100" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">Create your SynapseOS account</h2>
          <p className="mt-2 text-sm leading-7 text-white/56">
            Provision a secure user account with hashed credentials and role-aware access defaults.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2 sm:col-span-2">
          <span className="text-sm font-medium text-white/78">Full name</span>
          <Input
            type="text"
            placeholder="Taylor Morgan"
            className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/32 transition focus:border-cyan-300/25 focus:bg-white/[0.07]"
            {...register("name")}
          />
          {errors.name ? <p className="text-sm text-rose-300">{errors.name.message}</p> : null}
        </label>

        <label className="block space-y-2 sm:col-span-2">
          <span className="text-sm font-medium text-white/78">Work email</span>
          <Input
            type="email"
            placeholder="you@synapseos.dev"
            className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/32 transition focus:border-cyan-300/25 focus:bg-white/[0.07]"
            {...register("email")}
          />
          {errors.email ? <p className="text-sm text-rose-300">{errors.email.message}</p> : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-white/78">Password</span>
          <PasswordInput
            placeholder="Create a strong password"
            className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/32 transition focus:border-cyan-300/25 focus:bg-white/[0.07]"
            resetVisibilityKey={successKey}
            {...register("password")}
          />
          {errors.password ? <p className="text-sm text-rose-300">{errors.password.message}</p> : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-white/78">Confirm password</span>
          <PasswordInput
            placeholder="Confirm your password"
            className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/32 transition focus:border-cyan-300/25 focus:bg-white/[0.07]"
            resetVisibilityKey={successKey}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-rose-300">{errors.confirmPassword.message}</p>
          ) : null}
        </label>
      </div>

      {errors.root ? (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errors.root.message}</span>
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-12 w-full rounded-full border border-cyan-200/20 bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 text-slate-950 shadow-[0_0_40px_rgba(82,176,255,0.3)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_56px_rgba(82,176,255,0.4)]"
        disabled={isPending}
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        Create account
      </Button>

      <p className="text-sm text-white/52">
        Already have an account?{" "}
        <a href="/login" className="text-cyan-100 transition-colors hover:text-white">
          Sign in
        </a>
      </p>
    </form>
  );
}
