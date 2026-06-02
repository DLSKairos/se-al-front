import { useEffect, useRef, useState } from 'react'
import SignaturePad from 'signature_pad'
import { PenLine, Trash2, RotateCcw } from 'lucide-react'

export interface FirmaData {
  nombre: string
  firma_url: string | null
}

interface FirmasActaProps {
  firmaDeposito: FirmaData
  firmaAgencia: FirmaData
  onFirmaDeposito: (data: FirmaData) => void
  onFirmaAgencia: (data: FirmaData) => void
}

interface BloqueFirmaProps {
  titulo: string
  data: FirmaData
  onChange: (data: FirmaData) => void
}

function BloqueFirma({ titulo, data, onChange }: BloqueFirmaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePad | null>(null)
  const [modoFirma, setModoFirma] = useState(!data.firma_url)
  const [isEmpty, setIsEmpty] = useState(!data.firma_url)

  useEffect(() => {
    if (!modoFirma) return
    const canvas = canvasRef.current
    if (!canvas) return

    const pad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(0,0,0,0)',
      penColor: '#00D4FF',
      minWidth: 1,
      maxWidth: 2.5,
    })
    padRef.current = pad

    const resizeObserver = new ResizeObserver(() => {
      const ratio = Math.max(window.devicePixelRatio ?? 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(ratio, ratio)
      pad.clear()
    })
    resizeObserver.observe(canvas)

    pad.addEventListener('endStroke', () => {
      const dataURL = pad.toDataURL('image/png')
      setIsEmpty(pad.isEmpty())
      onChange({ ...data, firma_url: dataURL })
    })

    return () => {
      resizeObserver.disconnect()
      pad.off()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoFirma])

  const limpiarFirma = () => {
    padRef.current?.clear()
    setIsEmpty(true)
    onChange({ ...data, firma_url: null })
  }

  const refirmar = () => {
    onChange({ ...data, firma_url: null })
    setModoFirma(true)
    setIsEmpty(true)
  }

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-['DM_Sans']">
          {titulo}
        </p>
        <input
          type="text"
          value={data.nombre}
          placeholder="Nombre y cargo"
          onChange={e => onChange({ ...data, nombre: e.target.value })}
          className="w-full bg-[var(--navy)] border border-white/10 rounded-[var(--radius-input)] px-3 py-2 text-[var(--off-white)] placeholder-white/20 text-sm font-['DM_Sans'] focus:outline-none focus:border-[var(--signal)]/50 transition-colors"
        />
      </div>

      {/* Canvas o imagen de firma */}
      {!modoFirma && data.firma_url ? (
        <div className="flex flex-col gap-2">
          <div className="relative rounded-[var(--radius-input)] overflow-hidden border border-emerald-500/30 bg-white">
            <img
              src={data.firma_url}
              alt={`Firma de ${titulo}`}
              className="w-full h-20 object-contain p-1"
            />
          </div>
          <button
            type="button"
            onClick={refirmar}
            className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-btn)] bg-[var(--navy-light)] border border-white/10 text-white/50 text-xs font-['DM_Sans'] hover:border-white/20 hover:text-white/70 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Re-firmar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div
            className="relative rounded-[var(--radius-input)] overflow-hidden border-2 border-dashed border-[var(--signal)]/30 bg-white/5"
            style={{ height: 80 }}
          >
            {isEmpty && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <PenLine className="w-5 h-5 text-white/20" aria-hidden="true" />
                <p className="text-[11px] text-white/20 font-['DM_Sans']">Firma aquí</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              aria-label={`Campo de firma: ${titulo}`}
              className="w-full h-full block touch-none"
            />
          </div>
          {!isEmpty && (
            <button
              type="button"
              onClick={limpiarFirma}
              className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-btn)] bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-['DM_Sans'] hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Limpiar firma
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function FirmasActa({ firmaDeposito, firmaAgencia, onFirmaDeposito, onFirmaAgencia }: FirmasActaProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <PenLine className="w-4 h-4 text-white/40" aria-hidden="true" />
        <h3 className="text-sm font-['Syne'] font-semibold text-[var(--off-white)]">
          Firmas de cierre
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <BloqueFirma
          titulo="Representante del Depósito"
          data={firmaDeposito}
          onChange={onFirmaDeposito}
        />
        <div className="hidden sm:block w-px bg-white/10 self-stretch" aria-hidden="true" />
        <BloqueFirma
          titulo="Representante de la Agencia"
          data={firmaAgencia}
          onChange={onFirmaAgencia}
        />
      </div>
    </div>
  )
}
