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

const toastClasses: Record<ToastType, string> = {
  success: 'border-l-4 border-l-emerald-500 border-r-0 border-t-0 border-b-0',
  error:   'border-l-4 border-l-red-500 border-r-0 border-t-0 border-b-0',
  warning: 'border-l-4 border-l-amber-500 border-r-0 border-t-0 border-b-0',
}

const iconClasses: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error:   'text-red-400',
  warning: 'text-amber-400',
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
      <div className="fixed bottom-24 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <div
              key={toast.id}
              className={`glass flex items-center gap-3 px-4 py-3 rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] pointer-events-auto animate-[slideUp_0.2s_ease] ${toastClasses[toast.type]}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${iconClasses[toast.type]}`} />
              <p className="text-sm text-[var(--off-white)] font-dm flex-1">{toast.message}</p>
              <button
                onClick={() => remove(toast.id)}
                className="text-[var(--muted)] hover:text-[var(--off-white)] transition-colors shrink-0 ml-auto"
                aria-label="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
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
