import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui'
import { MapPin, Clock, Smartphone, ShieldCheck } from 'lucide-react'
import type { GeolocationResult } from './useGeolocation'

interface EvidenceSummaryModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  position: GeolocationResult | null
}

function formatCoords(position: GeolocationResult): string {
  return `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)} (±${Math.round(position.accuracy)} m)`
}

function getDeviceLabel(): string {
  const ua = navigator.userAgent
  if (/iPhone/i.test(ua)) return 'iPhone'
  if (/iPad/i.test(ua)) return 'iPad'
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac/i.test(ua)) return 'Mac'
  return 'Dispositivo desconocido'
}

/**
 * Modal previo a confirmar la firma.
 * Muestra el resumen de evidencias que quedarán registradas:
 * ubicación, fecha/hora y dispositivo.
 */
export default function EvidenceSummaryModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  position,
}: EvidenceSummaryModalProps) {
  const now = new Date()
  const formattedDate = now.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = now.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const evidences = [
    {
      icon: MapPin,
      label: 'Ubicación',
      value: position ? formatCoords(position) : 'No disponible',
      color: position ? 'text-[var(--signal)]' : 'text-[var(--amber)]',
    },
    {
      icon: Clock,
      label: 'Fecha y hora',
      value: `${formattedDate}, ${formattedTime}`,
      color: 'text-[var(--signal)]',
    },
    {
      icon: Smartphone,
      label: 'Dispositivo',
      value: getDeviceLabel(),
      color: 'text-[var(--signal)]',
    },
  ]

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) onClose() }}
      title="Confirmar firma"
      description="Los siguientes datos quedarán registrados como evidencia legal de tu firma."
      size="md"
    >
      <div className="flex flex-col gap-5">
        {/* Icono de escudo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[var(--signal-dim)] flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-[var(--signal)]" />
          </div>
        </div>

        {/* Evidencias */}
        <div className="flex flex-col gap-3">
          {evidences.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="flex items-start gap-3 p-3 rounded-[var(--radius-input)] bg-white/5 border border-white/5"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--signal-dim)] flex items-center justify-center shrink-0 mt-0.5">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)] font-['DM_Sans']">{label}</p>
                <p className="text-sm text-[var(--off-white)] font-['DM_Sans'] break-words">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[var(--muted)] font-['DM_Sans'] text-center">
          Al confirmar, tu firma queda registrada bajo la Ley 527 de 1999 de Colombia.
        </p>

        {/* Acciones */}
        <div className="flex flex-col gap-2.5 pt-1">
          <Button
            variant="primary"
            size="lg"
            className="w-full min-h-[52px]"
            onClick={onConfirm}
            loading={loading}
            aria-label="Confirmar y firmar documento"
          >
            <ShieldCheck className="w-5 h-5" />
            Confirmar y firmar
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
