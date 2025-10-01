import * as React from "react"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  onClose: (id: string) => void
}

export function Toast({ id, title, description, variant = "default", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [id, onClose])

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        {
          "border-border bg-background text-foreground": variant === "default",
          "border-destructive/50 bg-destructive text-destructive-foreground": variant === "destructive",
          "border-emerald-200 bg-emerald-50 text-emerald-800": variant === "success",
        },
      )}
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

const ToastContext = React.createContext<{
  toast: (props: Omit<ToastProps, "id" | "onClose">) => void
  toasts: ToastProps[]
} | null>(null)

export function useToast() {
  const context = React.useContext(ToastContext)
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback(({ title, description, variant = "default" }: Omit<ToastProps, "id" | "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [
      ...prev,
      {
        id,
        title,
        description,
        variant,
        onClose: (toastId) => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId))
        },
      },
    ])
  }, [])

  if (!context) {
    return { toasts, toast }
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback(({ title, description, variant = "default" }: Omit<ToastProps, "id" | "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [
      ...prev,
      {
        id,
        title,
        description,
        variant,
        onClose: (toastId) => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId))
        },
      },
    ])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, toasts }}>
      {children}
      <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}