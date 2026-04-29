interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  fullscreen?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export function LoadingSpinner({
  size = 'md',
  label = 'Cargando...',
  fullscreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div role="status" aria-label={label} className="flex flex-col items-center gap-3">
      <div
        className={`${sizeClasses[size]} border-2 border-[var(--signal-dim)] border-t-[var(--signal)] rounded-full animate-spin`}
        aria-hidden="true"
      />
      {label && (
        <p className="text-sm text-[var(--muted)] font-['DM_Sans']">{label}</p>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div data-testid="loading-spinner" className="fixed inset-0 flex items-center justify-center bg-[var(--navy)]/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    )
  }

  return <div data-testid="loading-spinner" className="flex items-center justify-center p-8">{spinner}</div>
}
