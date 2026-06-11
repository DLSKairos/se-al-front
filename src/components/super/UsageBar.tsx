/**
 * Barra de progreso de uso (usuarios o sedes).
 * Verde < 70 %, ámbar 70–95 %, rojo > 95 %.
 */
interface UsageBarProps {
  current: number
  max:     number
  label:   string
}

function getBarColor(pct: number): string {
  if (pct > 95) return 'bg-red-500'
  if (pct > 70) return 'bg-amber-400'
  return 'bg-emerald-400'
}

export function UsageBar({ current, max, label }: UsageBarProps) {
  const pct     = max > 0 ? Math.min((current / max) * 100, 100) : 0
  const barColor = getBarColor(pct)

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between text-xs font-['DM_Sans']">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="text-[var(--off-white)] tabular-nums">
          {current} / {max}
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${current} de ${max}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
