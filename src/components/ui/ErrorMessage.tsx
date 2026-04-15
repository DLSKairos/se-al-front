import { AlertCircle } from 'lucide-react'
import { Button } from './Button'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <div>
        <h3 className="font-['Syne'] font-semibold text-[var(--off-white)] mb-1">{title}</h3>
        <p className="text-sm text-[var(--muted)] font-['DM_Sans']">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
