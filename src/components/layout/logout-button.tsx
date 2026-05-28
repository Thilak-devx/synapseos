"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false);
  const { pushToast } = useToast();

  async function handleLogout() {
    setIsPending(true);
    pushToast({
      title: "Signing out",
      description: "Closing your current SynapseOS session.",
      tone: "info",
    });
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <Button
      variant="outline"
      className="w-full justify-start rounded-2xl border-white/10 bg-[rgba(8,15,30,0.7)] text-white hover:border-cyan-400/20 hover:bg-[rgba(12,21,40,0.86)] hover:text-white"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      Logout
    </Button>
  );
}
