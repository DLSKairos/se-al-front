import { Bell } from 'lucide-react'
import { SOSButton } from '@/components/ui/SOSButton'

export default function AlertasPage() {
  return (
    <div
      className="min-h-screen bg-[var(--navy)] flex flex-col pb-24"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="px-6 pt-4 pb-2">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)]">
          Notificaciones
        </p>
        <h1 className="font-display font-extrabold text-base text-[var(--off-white)]">
          Alertas
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 gap-5">
        <div className="w-20 h-20 rounded-full bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.1)] flex items-center justify-center">
          <Bell className="w-8 h-8 text-[var(--muted)]" />
        </div>
        <div className="text-center">
          <p className="text-base font-display font-semibold text-[var(--off-white)] mb-2">
            Próximamente
          </p>
          <p className="text-sm text-[var(--muted)] font-dm max-w-xs">
            Aquí verás notificaciones de tus permisos, aprobaciones y eventos importantes.
          </p>
        </div>
      </div>

      <SOSButton />
    </div>
  )
}
