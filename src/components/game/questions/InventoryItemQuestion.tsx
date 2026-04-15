/**
 * InventoryItemQuestion — pregunta de inventario con campos: Buena / Mala / Estado
 *
 * Props:
 *   question  { id, label?, question? }
 *   onAnswer  (questionId, { buena, mala, estado }) => void
 */
import { useState } from 'react'

interface InventoryAnswer {
  buena:  string
  mala:   string
  estado: string
}

interface InventoryItemQuestionProps {
  question: {
    id:        string
    label?:    string
    question?: string
  }
  onAnswer: (questionId: string, value: InventoryAnswer) => void
}

export default function InventoryItemQuestion({ question, onAnswer }: InventoryItemQuestionProps) {
  const [buena,  setBuena]  = useState('')
  const [mala,   setMala]   = useState('')
  const [estado, setEstado] = useState('')

  const handleSubmit = () => {
    onAnswer(question.id, {
      buena:  buena  || '0',
      mala:   mala   || '0',
      estado: estado || '',
    })
  }

  const fields: Array<{
    label:       string
    value:       string
    setter:      (v: string) => void
    placeholder: string
    color:       string
    numeric?:    boolean
  }> = [
    {
      label:       'Buena',
      value:       buena,
      setter:      setBuena,
      placeholder: '0',
      color:       'border-green-500 focus:border-green-400',
      numeric:     true,
    },
    {
      label:       'Mala',
      value:       mala,
      setter:      setMala,
      placeholder: '0',
      color:       'border-red-500 focus:border-red-400',
      numeric:     true,
    },
    {
      label:       'Estado',
      value:       estado,
      setter:      setEstado,
      placeholder: 'Ej: OK, Roto...',
      color:       'border-blue-500 focus:border-blue-400',
    },
  ]

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <div className="glass-card-md px-4 py-3 w-full text-center">
        <p className="text-[var(--off-white)] font-semibold font-['DM_Sans'] text-base m-0">
          {question.label ?? question.question}
        </p>
      </div>
      <div className="w-0 h-0 mx-auto speech-triangle-down" aria-hidden="true" />

      <div className="flex gap-3 justify-center flex-wrap">
        {fields.map((f) => (
          <div key={f.label} className="flex flex-col items-center gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wide font-['DM_Sans'] ${
              f.label === 'Buena'
                ? 'text-green-400'
                : f.label === 'Mala'
                ? 'text-red-400'
                : 'text-blue-400'
            }`}>
              {f.label}
            </label>
            <input
              type={f.numeric ? 'text' : 'text'}
              inputMode={f.numeric ? 'numeric' : undefined}
              pattern={f.numeric ? '[0-9]*' : undefined}
              value={f.value}
              onChange={(e) =>
                f.setter(
                  f.numeric
                    ? e.target.value.replace(/[^0-9]/g, '')
                    : e.target.value
                )
              }
              placeholder={f.placeholder}
              className={[
                'bg-[var(--navy-light)] text-[var(--off-white)] font-bold text-lg',
                'border-2 rounded-xl outline-none px-2 py-2.5 text-center',
                'placeholder:text-[var(--muted)] transition-colors',
                f.numeric ? 'w-[72px]' : 'w-[110px] text-sm',
                f.color,
              ].join(' ')}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full max-w-sm py-3 rounded-xl bg-[var(--signal)] text-[var(--navy)] font-bold font-['Syne'] text-sm hover:opacity-90 active:scale-95 transition-all"
        onClick={handleSubmit}
      >
        Confirmar →
      </button>
    </div>
  )
}
