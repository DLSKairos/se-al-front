/**
 * MultiSelectQuestion — filas grandes: círculo = una opción, cuadrado = varias.
 */
import { useState } from 'react'
import { Check } from 'lucide-react'

interface Option {
  label: string
  value: string
  icon?: string
}

interface MultiSelectQuestionProps {
  options?: Option[]
  multiple?: boolean
  typingDone?: boolean
  onAnswer: (value: string | string[]) => void
}

function MultiSelectQuestion({
  options: propOptions,
  multiple = true,
  typingDone = true,
  onAnswer,
}: MultiSelectQuestionProps) {
  const [selected,  setSelected]  = useState<Set<string>>(new Set())
  const [confirmed, setConfirmed] = useState(false)

  const options = propOptions ?? []

  const toggleOption = (value: string) => {
    if (confirmed) return
    setSelected((prev) => {
      if (!multiple) return new Set([value])
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const handleConfirm = () => {
    if (selected.size < 1 || confirmed) return
    setConfirmed(true)
    const values = Array.from(selected)
    onAnswer(multiple ? values : (values[0] ?? ''))
  }

  const canConfirm = selected.size >= 1

  return (
    <div className={`flex flex-col gap-3 w-full ${typingDone ? 'game-bounce-in' : 'opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col gap-2.5" role="group" aria-label="Opciones">
        {options.map((opt) => {
          const isSelected = selected.has(opt.value)
          return (
            <button
              key={opt.value}
              className={`flex items-center gap-4 w-full min-h-[72px] px-4 rounded-[20px] border-[3px] text-left transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:opacity-50 ${
                isSelected ? 'border-[var(--fg)] bg-[var(--brand)] text-[var(--on-brand)]' : 'border-[color:var(--line-strong)] bg-[var(--surface)] text-[var(--fg)]'
              }`}
              onClick={() => toggleOption(opt.value)}
              disabled={confirmed}
              aria-pressed={isSelected}
            >
              <span
                className={`shrink-0 w-9 h-9 border-[3px] border-[var(--fg)] grid place-items-center ${multiple ? 'rounded-[8px]' : 'rounded-full'} ${isSelected ? 'bg-[var(--fg)] text-[var(--bg)]' : 'bg-transparent'}`}
                aria-hidden="true"
              >
                {isSelected && <Check className="w-5 h-5" strokeWidth={4} />}
              </span>
              {opt.icon && <span className="text-3xl shrink-0" aria-hidden="true">{opt.icon}</span>}
              <span className="flex-1 font-display font-bold text-[24px] leading-tight">{opt.label}</span>
            </button>
          )
        })}
      </div>

      <button className="btn-3d w-full" onClick={handleConfirm} disabled={!canConfirm || confirmed}>
        {confirmed ? <><Check className="w-6 h-6" strokeWidth={3.5} /> Listo</> : 'Confirmar'}
      </button>
    </div>
  )
}

export default MultiSelectQuestion
