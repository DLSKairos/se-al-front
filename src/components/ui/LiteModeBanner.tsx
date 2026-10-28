import { Zap } from 'lucide-react'
import { Button } from './Button'

interface LiteModeBannerProps {
  onIgnore: () => void
  onActivate: () => void
}

export function LiteModeBanner({ onIgnore, onActivate }: LiteModeBannerProps) {
  return (
    <div
      className="fixed inset-0 z-[9000] flex items-end justify-center bg-[rgba(23,22,15,0.5)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lite-banner-title"
      aria-describedby="lite-banner-desc"
    >
      <div className="liquid w-full max-w-md mx-3 mb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] rounded-[28px] p-6 flex flex-col gap-4 animate-[sheetUp_0.32s_var(--ease-out)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[14px] bg-[var(--warn)] text-[var(--on-warn)] flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 id="lite-banner-title" className="font-display font-bold text-2xl text-[var(--fg)] leading-tight">
            Conexión lenta detectada
          </h2>
        </div>

        <p id="lite-banner-desc" className="text-base text-[var(--fg-muted)] font-body leading-relaxed">
          La versión lite carga más rápido: sin animaciones y con acceso directo a los formularios.
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <Button variant="primary" size="lg" onClick={onActivate} className="w-full">
            Usar versión lite
          </Button>
          <Button variant="ghost" onClick={onIgnore} className="w-full">
            Ignorar
          </Button>
        </div>
      </div>
    </div>
  )
}
