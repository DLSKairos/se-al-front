import { useState } from 'react'
import { PhoneCall } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

const EMERGENCY_NUMBER = '123'

export function SOSButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_24px_rgba(239,68,68,0.5)] hover:bg-red-500 hover:shadow-[0_0_32px_rgba(239,68,68,0.7)] transition-all active:scale-95"
        aria-label="Llamar a emergencias"
      >
        <span className="text-xl font-['Syne'] font-bold text-white leading-none">SOS</span>
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Linea de emergencias"
        description="Comunicate de inmediato si hay una situacion de riesgo."
        size="sm"
      >
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <PhoneCall className="w-9 h-9 text-red-400" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-[var(--muted)] text-sm font-['DM_Sans'] mb-1">
              Numero de emergencia
            </p>
            <p className="text-[var(--off-white)] text-4xl font-['Syne'] font-bold tracking-widest">
              {EMERGENCY_NUMBER}
            </p>
          </div>
          <a
            href={`tel:${EMERGENCY_NUMBER}`}
            className="w-full"
            aria-label={`Llamar al ${EMERGENCY_NUMBER}`}
          >
            <Button variant="danger" className="w-full py-4 text-base gap-2">
              <PhoneCall className="w-5 h-5" aria-hidden="true" />
              Llamar ahora
            </Button>
          </a>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
        </div>
      </Modal>
    </>
  )
}
