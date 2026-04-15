import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'draft'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--signal-dim)] text-[var(--signal)] border border-[var(--signal)]/20',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  danger:  'bg-red-500/10 text-red-400 border border-red-500/20',
  info:    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  draft:   'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-[var(--radius-badge)] ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
