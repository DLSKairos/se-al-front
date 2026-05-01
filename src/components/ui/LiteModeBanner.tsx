interface LiteModeBannerProps {
  onIgnore: () => void
  onActivate: () => void
}

export function LiteModeBanner({ onIgnore, onActivate }: LiteModeBannerProps) {
  return (
    <div
      className="fixed inset-0 z-[9000] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lite-banner-title"
      aria-describedby="lite-banner-desc"
    >
      {/* Card anclada al fondo */}
      <div className="glass w-full max-w-md mx-4 mb-8 rounded-[24px] p-6 flex flex-col gap-4 border border-amber-500/20">
        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <span className="text-xl" aria-hidden="true">⚡</span>
          </div>
          <h2
            id="lite-banner-title"
            className="font-display font-bold text-lg text-amber-400 leading-tight"
          >
            Conexión lenta detectada
          </h2>
        </div>

        {/* Descripción */}
        <p
          id="lite-banner-desc"
          className="text-sm text-[var(--muted)] font-['DM_Sans'] leading-relaxed"
        >
          La versión lite carga más rápido: sin animaciones, acceso directo a los formularios.
        </p>

        {/* Acciones */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={onIgnore}
            className="px-4 py-2 rounded-[10px] text-sm font-semibold text-[var(--muted)] font-['DM_Sans'] hover:text-[var(--off-white)] hover:bg-white/5 transition-all"
          >
            Ignorar
          </button>
          <button
            type="button"
            onClick={onActivate}
            className="px-4 py-2 rounded-[10px] text-sm font-semibold text-amber-400 font-['DM_Sans'] bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-300 transition-all"
          >
            Usar versión lite →
          </button>
        </div>
      </div>
    </div>
  )
}
