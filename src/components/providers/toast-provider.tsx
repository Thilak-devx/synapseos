"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type ToastInput = {
  description?: string;
  title: string;
  tone?: ToastTone;
};

type ToastRecord = ToastInput & {
  id: string;
};

type ToastContextValue = {
  dismissToast: (id: string) => void;
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, string> = {
  success: "border-emerald-300/20 bg-emerald-300/12 text-emerald-50",
  error: "border-rose-300/20 bg-rose-300/12 text-rose-50",
  info: "border-cyan-300/20 bg-cyan-300/12 text-cyan-50",
};

const toneIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timeoutMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timeout = timeoutMap.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutMap.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID();
      const record: ToastRecord = {
        id,
        tone: "info",
        ...toast,
      };

      setToasts((current) => [...current.slice(-2), record]);

      const timeout = setTimeout(() => {
        dismissToast(id);
      }, 3800);

      timeoutMap.current.set(id, timeout);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      dismissToast,
      pushToast,
    }),
    [dismissToast, pushToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-4 sm:justify-end sm:px-6 sm:pb-6">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => {
              const Icon = toneIcons[toast.tone ?? "info"];

              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={cn(
                    "pointer-events-auto rounded-[1.4rem] border px-4 py-4 shadow-lg shadow-black/10",
                    toneStyles[toast.tone ?? "info"],
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/15">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{toast.title}</p>
                      {toast.description ? (
                        <p className="mt-1 text-sm leading-6 text-white/70">{toast.description}</p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
                      onClick={() => dismissToast(toast.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
