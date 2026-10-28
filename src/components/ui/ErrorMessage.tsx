import { TriangleAlert } from 'lucide-react'
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
    <div data-testid="error-message" className="flex flex-col items-center gap-4 p-8 text-center">
      <div className="w-14 h-14 rounded-[16px] bg-[var(--warn)] text-[var(--on-warn)] flex items-center justify-center">
        <TriangleAlert className="w-7 h-7" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-display font-bold text-xl text-[var(--fg)] mb-1">{title}</h3>
        <p className="text-base text-[var(--fg-muted)] font-body">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
