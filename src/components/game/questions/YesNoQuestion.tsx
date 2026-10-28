/**
 * YesNoQuestion — dos carteles táctiles grandes: Sí (cuadrado verde) / No (círculo rojo).
 * Sin N/A: el formulario normal solo guarda verdadero o falso, y N/A se guardaba como "No".
 */
import { useState } from 'react'
import { Check, X } from 'lucide-react'

interface YesNoQuestionProps {
  onAnswer: (value: boolean) => void
  typingDone?: boolean
}

function YesNoQuestion({ onAnswer, typingDone = true }: YesNoQuestionProps) {
  const [selected, setSelected] = useState<'yes' | 'no' | null>(null)

  const handleSelect = (value: 'yes' | 'no') => {
    if (selected) return
    setSelected(value)
    onAnswer(value === 'yes')
  }

  const base =
    'flex-1 min-h-[148px] flex flex-col items-center justify-center gap-2 rounded-[24px] border-[3px] font-display font-extrabold text-[34px] leading-none transition-[transform,opacity] duration-150 active:scale-[0.96] disabled:cursor-default'

  return (
    <div
      className={`flex gap-3 w-full ${typingDone ? 'game-bounce-in' : 'opacity-0 pointer-events-none'}`}
      role="group"
      aria-label="Respuesta"
    >
      <button
        className={`${base} bg-[var(--ok)] text-[var(--on-ok)] border-[var(--fg)] ${selected === 'no' ? 'opacity-35' : ''}`}
        onClick={() => handleSelect('yes')}
        disabled={!!selected}
        aria-pressed={selected === 'yes'}
      >
        <Check className="w-14 h-14" strokeWidth={3.5} aria-hidden="true" />
        Sí
      </button>
      <button
        className={`${base} bg-[var(--danger)] text-[var(--on-danger)] border-[var(--fg)] ${selected === 'yes' ? 'opacity-35' : ''}`}
        onClick={() => handleSelect('no')}
        disabled={!!selected}
        aria-pressed={selected === 'no'}
      >
        <X className="w-14 h-14" strokeWidth={3.5} aria-hidden="true" />
        No
      </button>
    </div>
  )
}

export default YesNoQuestion
