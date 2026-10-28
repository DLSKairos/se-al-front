interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  fullscreen?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-9 h-9 border-[3px]',
  lg: 'w-14 h-14 border-4',
}

export function LoadingSpinner({
  size = 'md',
  label = 'Cargando...',
  fullscreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div role="status" aria-label={label} className="flex flex-col items-center gap-3">
      <div
        className={`${sizeClasses[size]} border-[var(--line)] border-t-[var(--brand)] rounded-full animate-spin`}
        aria-hidden="true"
      />
      {label && <p className="text-base text-[var(--fg-muted)] font-body">{label}</p>}
    </div>
  )

  if (fullscreen) {
    return (
      <div data-testid="loading-spinner" className="fixed inset-0 flex items-center justify-center bg-[var(--bg)] z-50">
        {spinner}
      </div>
    )
  }

  return <div data-testid="loading-spinner" className="flex items-center justify-center p-8">{spinner}</div>
}
