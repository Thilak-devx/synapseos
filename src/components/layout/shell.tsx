import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ShellProps = {
  children: ReactNode;
  className?: string;
};

export function Shell({ children, className }: ShellProps) {
  return <div className={cn("mx-auto w-full max-w-7xl px-6 md:px-8", className)}>{children}</div>;
}
