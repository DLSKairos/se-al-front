import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'draft'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  title?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--wash-brand)] text-[var(--fg)] border-[color:var(--brand)]',
  success: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/45',
  warning: 'bg-amber-500/14 text-amber-400 border-amber-500/50',
  danger:  'bg-red-500/12 text-red-400 border-red-500/45',
  info:    'bg-blue-500/12 text-blue-400 border-blue-500/45',
  draft:   'bg-[var(--wash)] text-[var(--fg-muted)] border-[color:var(--line-strong)] border-dashed',
}

/**
 * Pictograma de estado: la forma comunica el estado igual que un cartel ISO 7010,
 * así no depende solo del color (cuadrado = seguro, triángulo = atención,
 * círculo tachado = prohibido, círculo = información).
 */
function Shape({ variant }: { variant: BadgeVariant }) {
  const common = { width: 11, height: 11, viewBox: '0 0 12 12', 'aria-hidden': true, className: 'shrink-0' } as const
  switch (variant) {
    case 'success':
      return <svg {...common}><rect x="1" y="1" width="10" height="10" rx="2" fill="currentColor" /></svg>
    case 'warning':
      return <svg {...common}><path d="M6 1 11.2 10.5H.8z" fill="currentColor" /></svg>
    case 'danger':
      return <svg {...common}><circle cx="6" cy="6" r="5" fill="currentColor" /></svg>
    case 'info':
      return <svg {...common}><circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
    case 'draft':
      return <svg {...common}><circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" /></svg>
    default:
      return <svg {...common}><rect x="2" y="2" width="8" height="8" rx="1.5" transform="rotate(45 6 6)" fill="currentColor" /></svg>
  }
}

export function Badge({ children, variant = 'default', className = '', title }: BadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] leading-none font-semibold border rounded-[var(--radius-badge)] ${variantClasses[variant]} ${className}`}
    >
      <Shape variant={variant} />
      {children}
    </span>
  )
}
