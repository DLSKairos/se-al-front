import { ChevronLeft, ChevronRight, FileText, Building2, List, CheckCircle2 } from 'lucide-react'

interface StepperInventarioProps {
  pasoActual: 1 | 2 | 3 | 4
  onPasoClick?: (paso: number) => void
  pasosCompletados: Set<number>
}

const pasos = [
  { numero: 1, label: 'Factura',  Icon: FileText    },
  { numero: 2, label: 'Cabecera', Icon: Building2   },
  { numero: 3, label: 'Ítems',    Icon: List         },
  { numero: 4, label: 'Cierre',   Icon: CheckCircle2 },
]

export function StepperInventario({ pasoActual, onPasoClick, pasosCompletados }: StepperInventarioProps) {
  const pasoAnterior = pasoActual > 1 ? pasoActual - 1 : null
  const pasoSiguiente = pasoActual < 4 ? pasoActual + 1 : null
  const pasoInfo = pasos[pasoActual - 1]

  return (
    <>
      {/* Desktop — stepper completo */}
      <nav aria-label="Pasos del acta" className="hidden sm:flex items-center gap-0">
        {pasos.map((paso, idx) => {
          const completado = pasosCompletados.has(paso.numero)
          const activo = paso.numero === pasoActual
          const futuro = paso.numero > pasoActual && !completado
          const clickable = !!onPasoClick && (completado || paso.numero <= pasoActual)

          return (
            <div key={paso.numero} className="flex items-center">
              <button
                type="button"
                onClick={() => clickable && onPasoClick?.(paso.numero)}
                disabled={!clickable}
                aria-current={activo ? 'step' : undefined}
                className={[
                  'flex flex-col items-center gap-1.5 px-5 py-3 transition-all duration-200 disabled:cursor-default',
                  clickable ? 'cursor-pointer' : 'cursor-default',
                ].join(' ')}
              >
                <div
                  className={[
                    'flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-200',
                    completado
                      ? 'bg-[var(--signal)] border-[var(--signal)] text-[var(--navy)]'
                      : activo
                        ? 'bg-[var(--signal-dim)] border-[var(--signal)] text-[var(--signal)] shadow-[0_0_12px_rgba(0,212,255,0.35)]'
                        : 'bg-[var(--navy-light)] border-white/10 text-white/30',
                    futuro ? 'opacity-50' : '',
                  ].join(' ')}
                >
                  <paso.Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <span
                  className={[
                    "text-xs font-['Syne'] font-medium transition-colors duration-200",
                    completado ? 'text-[var(--signal)]' : activo ? 'text-[var(--off-white)]' : 'text-white/30',
                  ].join(' ')}
                >
                  {paso.label}
                </span>
              </button>

              {idx < pasos.length - 1 && (
                <div
                  className={[
                    'h-px w-8 transition-colors duration-300',
                    completado ? 'bg-[var(--signal)]/60' : 'bg-white/10',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </nav>

      {/* Mobile — solo paso actual + flechas */}
      <div className="flex sm:hidden items-center justify-between w-full px-1">
        <button
          type="button"
          onClick={() => pasoAnterior && onPasoClick?.(pasoAnterior)}
          disabled={!pasoAnterior}
          aria-label="Paso anterior"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--navy-light)] border border-white/10 text-white/50 disabled:opacity-20 disabled:cursor-default transition-opacity"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--signal-dim)] border-2 border-[var(--signal)] text-[var(--signal)] shadow-[0_0_14px_rgba(0,212,255,0.35)]">
            <pasoInfo.Icon className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="text-xs font-['Syne'] font-semibold text-[var(--signal)]">
            {pasoInfo.label}
          </span>
          <span className="text-[10px] text-white/30 font-['DM_Sans']">
            Paso {pasoActual} de {pasos.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => pasoSiguiente && onPasoClick?.(pasoSiguiente)}
          disabled={!pasoSiguiente}
          aria-label="Paso siguiente"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--navy-light)] border border-white/10 text-white/50 disabled:opacity-20 disabled:cursor-default transition-opacity"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Barra de progreso móvil */}
      <div className="sm:hidden w-full h-0.5 bg-white/10 rounded-full mt-2" aria-hidden="true">
        <div
          className="h-full bg-[var(--signal)] rounded-full transition-all duration-300"
          style={{ width: `${(pasoActual / pasos.length) * 100}%` }}
        />
      </div>
    </>
  )
}
