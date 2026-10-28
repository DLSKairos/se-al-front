import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertCircle,
}

// Cada estado es un pictograma sólido de color ISO: el color nunca viaja solo.
const iconClasses: Record<ToastType, string> = {
  success: 'bg-[var(--ok)] text-[var(--on-ok)]',
  error:   'bg-[var(--danger)] text-[var(--on-danger)]',
  warning: 'bg-[var(--warn)] text-[var(--on-warn)]',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback(
    (type: ToastType, message: string) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => remove(id), 4000)
    },
    [remove],
  )

  const ctx: ToastContextValue = {
    success: (m) => add('success', m),
    error:   (m) => add('error', m),
    warning: (m) => add('warning', m),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        className="fixed inset-x-4 z-[9999] mx-auto flex flex-col gap-2 max-w-md pointer-events-none"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <div
              key={toast.id}
              data-testid="toast-message"
              className={`toast-${toast.type} liquid flex items-center gap-3 pl-2.5 pr-2 py-2.5 rounded-[20px] pointer-events-auto animate-[fadeUp_0.3s_var(--ease-out)]`}
            >
              <span className={`w-9 h-9 rounded-[12px] grid place-items-center shrink-0 ${iconClasses[toast.type]}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <p className="text-base font-medium text-[var(--fg)] font-body flex-1 leading-snug">{toast.message}</p>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => remove(toast.id)}
                className="shrink-0 w-10 h-10 grid place-items-center rounded-full text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--wash)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
