import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95">
      <Shell className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-2xl border border-border/70 bg-card shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="type-heading text-base text-foreground">SynapseOS</div>
            <div className="type-caption text-muted-foreground">Intelligent database OS</div>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            Next.js 16 Starter
          </Badge>
          <ThemeToggle />
          <a className={cn(buttonVariants({ variant: "default", size: "default" }))} href="/login">
            Open demo
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <a className={cn(buttonVariants({ variant: "default", size: "sm" }))} href="/login">
            Demo
          </a>
        </div>
      </Shell>
    </header>
  );
}
