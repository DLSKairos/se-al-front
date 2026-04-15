import { useState, useEffect } from 'react'
import { Wifi } from 'lucide-react'

export function SlowConnectionBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(sessionStorage.getItem('lite_mode') === 'true')
  }, [])

  if (!show) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs font-['DM_Sans']">
      <Wifi className="w-3.5 h-3.5 shrink-0" />
      <span>Conexion lenta detectada — modo lite activado</span>
    </div>
  )
}
