import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  actionDisabled?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  description: string;
  icon: LucideIcon;
  title: string;
};

export function EmptyState({
  actionDisabled,
  actionLabel,
  onAction,
  className,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-[1.4rem] border border-cyan-300/18 bg-cyan-300/10 text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.14)]">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-white/55">{description}</p>
      {actionLabel ? (
        <Button
          type="button"
          variant="outline"
          className="mt-5 rounded-full border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.08] hover:text-white"
          onClick={onAction}
          disabled={actionDisabled}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
