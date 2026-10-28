import { Wifi } from 'lucide-react'
import { useSlowConnection } from '@/hooks/useSlowConnection'

export function SlowConnectionBanner() {
  const isSlow = useSlowConnection()

  if (!isSlow) return null

  return (
    <div role="status" className="flex items-center gap-2 px-4 py-2.5 bg-[var(--warn)] text-[var(--on-warn)] text-sm font-semibold font-body">
      <Wifi className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>Conexión lenta: activa el modo lite para ir más rápido</span>
    </div>
  )
}
