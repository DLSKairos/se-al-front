import { useEffect, useRef, useState } from 'react'
import SignaturePad from 'signature_pad'
import { Trash2, PenLine } from 'lucide-react'
import { FormField } from '@/types'

interface SignatureFieldProps {
  field: FormField
  value: string
  onChange: (dataURL: string) => void
  disabled?: boolean
}

export function SignatureField({ field, value, onChange, disabled }: SignatureFieldProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const padRef      = useRef<SignaturePad | null>(null)
  const [isEmpty, setIsEmpty] = useState(!value)

  // Inicializar SignaturePad
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const pad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(22, 34, 56, 0)',
      penColor: '#00D4FF',
      minWidth: 1,
      maxWidth: 2.5,
    })

    padRef.current = pad

    // Si hay valor previo, cargarlo
    if (value) {
      pad.fromDataURL(value)
      setIsEmpty(false)
    }

    pad.addEventListener('endStroke', () => {
      const dataURL = pad.toDataURL('image/png')
      onChange(dataURL)
      setIsEmpty(pad.isEmpty())
    })

    // Redimensionar canvas al tamaño real del contenedor
    const resizeObserver = new ResizeObserver(() => {
      const ratio = Math.max(window.devicePixelRatio ?? 1, 1)
      canvas.width  = canvas.offsetWidth  * ratio
      canvas.height = canvas.offsetHeight * ratio
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(ratio, ratio)
      if (value) pad.fromDataURL(value)
      else pad.clear()
    })
    resizeObserver.observe(canvas)

    if (disabled) pad.off()

    return () => {
      resizeObserver.disconnect()
      pad.off()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled])

  const handleClear = () => {
    padRef.current?.clear()
    onChange('')
    setIsEmpty(true)
  }

  return (
    <div className="flex flex-col gap-2" id={`field-${field.id}`} data-testid={`field-${field.key}`}>
      <div
        className={`relative rounded-[var(--radius-input)] border overflow-hidden ${
          disabled ? 'opacity-50' : 'border-[var(--signal-dim)] hover:border-[var(--signal)]'
        } bg-[var(--navy-mid)] transition-colors`}
      >
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none select-none">
            <PenLine className="w-6 h-6 text-[var(--muted)]" aria-hidden="true" />
            <p className="text-xs text-[var(--muted)] font-['DM_Sans']">Firma aqui</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          aria-label={`Campo de firma: ${field.label}`}
          className="w-full h-40 block touch-none"
        />
      </div>

      {!disabled && !isEmpty && (
        <button
          type="button"
          onClick={handleClear}
          className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-['DM_Sans'] hover:bg-red-500/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          Limpiar firma
        </button>
      )}
    </div>
  )
}
