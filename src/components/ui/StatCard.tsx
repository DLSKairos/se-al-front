import { LucideIcon } from 'lucide-react'

type StatVariant = 'default' | 'signal' | 'amber' | 'success' | 'info' | 'danger'

interface StatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  variant?: StatVariant
}

const variantColors: Record<StatVariant, string> = {
  default: 'text-[var(--fg)]',
  signal:  'text-[var(--fg)]',
  amber:   'text-[var(--warn-ink)]',
  success: 'text-[var(--ok-ink)]',
  info:    'text-[var(--info-ink)]',
  danger:  'text-[var(--danger-ink)]',
}

const variantIcon: Record<StatVariant, string> = {
  default: 'bg-[var(--wash-brand)] text-[var(--fg)]',
  signal:  'bg-[var(--brand)] text-[var(--on-brand)]',
  amber:   'bg-[var(--warn)] text-[var(--on-warn)]',
  success: 'bg-[var(--ok)] text-[var(--on-ok)]',
  info:    'bg-[var(--info)] text-[var(--on-info)]',
  danger:  'bg-[var(--danger)] text-[var(--on-danger)]',
}

export function StatCard({ title, value, icon: Icon, variant = 'default' }: StatCardProps) {
  return (
    <div className="glass-card-md flex items-center gap-4 p-4">
      {Icon && (
        <div className={`w-12 h-12 rounded-[12px] ${variantIcon[variant]} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <p className={`text-4xl leading-none font-bold font-display ${variantColors[variant]}`}>{value}</p>
        <p className="text-sm font-medium text-[var(--fg-muted)] font-body mt-1 truncate">{title}</p>
      </div>
    </div>
  )
}
