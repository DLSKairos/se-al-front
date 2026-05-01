import { Wifi } from 'lucide-react'

export function SlowConnectionBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs font-['DM_Sans']">
      <Wifi className="w-3.5 h-3.5 shrink-0" />
      <span>Conexion lenta detectada — modo lite activado</span>
    </div>
  )
}
