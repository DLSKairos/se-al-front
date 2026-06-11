import { useRef, useEffect, useCallback, useState } from 'react'
import { Eraser, Check } from 'lucide-react'
import { Button } from '@/components/ui'
import type { StrokeVector } from '@/types'

interface SignatureResult {
  vectors: StrokeVector[]
  imageBase64: string
}

interface SignatureCanvasProps {
  onConfirm: (result: SignatureResult) => void
  disabled?: boolean
}

/**
 * Canvas de trazo manuscrito con soporte pointer events (touch + mouse).
 * Captura vectores {x, y, t} y entrega imagen PNG en base64 al confirmar.
 * Maneja devicePixelRatio para nitidez en pantallas de alta resolución.
 */
export default function SignatureCanvas({ onConfirm, disabled = false }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const vectorsRef = useRef<StrokeVector[]>([])
  const [hasStrokes, setHasStrokes] = useState(false)

  // ── Setup del canvas (DPR + contexto) ────────────────────────────────────
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0C1624'
  }, [])

  useEffect(() => {
    setupCanvas()
    window.addEventListener('resize', setupCanvas)
    return () => window.removeEventListener('resize', setupCanvas)
  }, [setupCanvas])

  // ── Coordenadas relativas al canvas ──────────────────────────────────────
  const getPos = (e: PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  // ── Handlers de dibujo ───────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.setPointerCapture(e.pointerId)
    isDrawingRef.current = true

    const pos = getPos(e.nativeEvent)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)

    vectorsRef.current.push({ x: Math.round(pos.x), y: Math.round(pos.y), t: Date.now() })
    setHasStrokes(true)
  }, [disabled])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getPos(e.nativeEvent)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    vectorsRef.current.push({ x: Math.round(pos.x), y: Math.round(pos.y), t: Date.now() })
  }, [disabled])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    e.preventDefault()
    isDrawingRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.closePath()
  }, [])

  // ── Limpiar canvas ───────────────────────────────────────────────────────
  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    vectorsRef.current = []
    setHasStrokes(false)
  }

  // ── Confirmar firma ──────────────────────────────────────────────────────
  const handleConfirm = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasStrokes) return

    // Exportar como PNG sin el fondo transparente
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height
    const exportCtx = exportCanvas.getContext('2d')!
    exportCtx.fillStyle = '#FFFFFF'
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
    exportCtx.drawImage(canvas, 0, 0)

    const imageBase64 = exportCanvas.toDataURL('image/png').split(',')[1]

    onConfirm({
      vectors: [...vectorsRef.current],
      imageBase64,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Instrucción */}
      <div className="flex items-center justify-center gap-2 text-[var(--muted)] text-sm font-['DM_Sans']">
        <svg
          className="w-4 h-4 text-[var(--signal)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        Firma aquí con tu dedo
      </div>

      {/* Área de firma */}
      <div
        className="relative rounded-[var(--radius-input)] overflow-hidden border-2 border-dashed border-[rgba(0,212,255,0.3)]"
        style={{ background: '#FFFFFF' }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full touch-none"
          style={{ height: '180px', cursor: disabled ? 'not-allowed' : 'crosshair' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          aria-label="Área de firma"
          role="img"
        />
        {!hasStrokes && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <span className="text-gray-300 text-sm font-['DM_Sans']">
              Traza tu firma aquí
            </span>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 min-h-[48px]"
          onClick={handleClear}
          disabled={!hasStrokes || disabled}
          aria-label="Limpiar firma"
        >
          <Eraser className="w-4 h-4" />
          Limpiar
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1 min-h-[48px]"
          onClick={handleConfirm}
          disabled={!hasStrokes || disabled}
          aria-label="Confirmar firma"
        >
          <Check className="w-5 h-5" />
          Confirmar firma
        </Button>
      </div>
    </div>
  )
}
