import { useState } from 'react'
import { PhoneCall } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

const EMERGENCY_NUMBER = '123'

/** Cartel de emergencia: cuadrado rojo ISO con texto blanco, siempre al alcance del pulgar. */
export function SOSButton({ atEdge = false }: { atEdge?: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed ${atEdge ? 'right-4' : 'right-[4.25rem]'} z-50 h-12 pl-3.5 pr-4 rounded-[16px] bg-[var(--danger)] text-[var(--on-danger)] inline-flex items-center gap-2 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(23,22,15,0.3),0_10px_20px_-8px_rgba(214,38,30,0.65)] active:scale-95 transition-transform duration-150`}
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        aria-label="Llamar a emergencias"
      >
        <PhoneCall className="w-5 h-5" aria-hidden="true" />
        <span className="text-xl font-display font-extrabold leading-none r">SOS</span>
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Línea de emergencias"
        description="Comunícate de inmediato si hay una situación de riesgo."
        size="sm"
      >
        <div className="flex flex-col items-center gap-6 py-2">
          <div className="text-center">
            <p className="text-[var(--fg-muted)] text-base font-body mb-1">Número de emergencia</p>
            <p className="text-[var(--fg)] text-7xl font-display font-extrabold r">
              {EMERGENCY_NUMBER}
            </p>
          </div>
          <a href={`tel:${EMERGENCY_NUMBER}`} className="w-full no-underline" aria-label={`Llamar al ${EMERGENCY_NUMBER}`}>
            <Button variant="danger" size="lg" className="w-full gap-2">
              <PhoneCall className="w-6 h-6" aria-hidden="true" />
              Llamar ahora
            </Button>
          </a>
          <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </>
  )
}
