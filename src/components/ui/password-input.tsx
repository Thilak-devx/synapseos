"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  toggleLabel?: {
    hidden: string
    visible: string
  }
  resetVisibilityKey?: string | number | boolean
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      toggleLabel = {
        hidden: "Show password",
        visible: "Hide password",
      },
      resetVisibilityKey,
      ...props
    },
    ref
  ) => {
    const [revealed, setRevealed] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement | null>(null)

    React.useEffect(() => {
      setRevealed(false)
    }, [resetVisibilityKey])

    function setRefs(node: HTMLInputElement | null) {
      inputRef.current = node

      if (typeof ref === "function") {
        ref(node)
        return
      }

      if (ref) {
        ref.current = node
      }
    }

    function handleToggleVisibility() {
      const element = inputRef.current
      const selectionStart = element?.selectionStart ?? null
      const selectionEnd = element?.selectionEnd ?? null

      setRevealed((current) => !current)

      window.requestAnimationFrame(() => {
        const activeElement = inputRef.current

        if (!activeElement) {
          return
        }

        activeElement.focus({ preventScroll: true })

        if (selectionStart !== null && selectionEnd !== null) {
          activeElement.setSelectionRange(selectionStart, selectionEnd)
        }
      })
    }

    return (
      <div className="relative">
        <Input
          ref={setRefs}
          type={revealed ? "text" : "password"}
          className={cn("pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={handleToggleVisibility}
          className="absolute right-2.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white/42 transition-all duration-200 hover:bg-cyan-300/10 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 focus-visible:ring-offset-0 active:scale-95"
          aria-label={revealed ? toggleLabel.visible : toggleLabel.hidden}
          aria-pressed={revealed}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={revealed ? "visible" : "hidden"}
              initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 10 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="inline-flex"
            >
              {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"
