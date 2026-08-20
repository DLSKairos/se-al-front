import { LucideIcon } from 'lucide-react'

type StatVariant = 'default' | 'signal' | 'amber' | 'success'

interface StatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  variant?: StatVariant
}

const variantColors: Record<StatVariant, string> = {
  default: 'text-[var(--off-white)]',
  signal:  'text-[var(--signal)]',
  amber:   'text-[var(--amber)]',
  success: 'text-emerald-400',
}

const variantIconBg: Record<StatVariant, string> = {
  default: 'bg-[var(--signal-dim)]',
  signal:  'bg-[var(--signal-dim)]',
  amber:   'bg-[rgba(245,166,35,0.15)]',
  success: 'bg-emerald-500/15',
}

const variantIconColor: Record<StatVariant, string> = {
  default: 'text-[var(--signal)]',
  signal:  'text-[var(--signal)]',
  amber:   'text-[var(--amber)]',
  success: 'text-emerald-400',
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className={`glass-card-md flex flex-col gap-3 p-5 stat-glow`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-[var(--muted)] font-dm uppercase tracking-wider">
          {title}
        </p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${variantIconBg[variant]} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${variantIconColor[variant]}`} />
          </div>
        )}
      </div>
      <div>
        <p className={`text-3xl font-bold font-display ${variantColors[variant]}`}>{value}</p>
      </div>
    </div>
  )
}
