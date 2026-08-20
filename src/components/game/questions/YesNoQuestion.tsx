/**
 * YesNoQuestion — botones táctiles grandes para responder Sí / No / N/A
 *
 * Props:
 *   onAnswer    fn — (value: boolean) => void
 *   typingDone  boolean — controlado por LevelWrapper
 */
import { useState } from 'react'

interface YesNoQuestionProps {
  onAnswer: (value: boolean) => void
  typingDone?: boolean
}

const DEFAULT_OPTIONS = [
  { value: 'yes', label: 'Sí',  icon: '✓', negative: false },
  { value: 'no',  label: 'No',  icon: '✗', negative: true  },
  { value: 'na',  label: 'N/A', icon: '—', negative: false },
]

const OPTION_COLORS: Record<string, string> = {
  yes: 'border-green-500 text-green-400 hover:bg-green-500/20 aria-pressed:bg-green-500/30',
  no:  'border-red-500  text-red-400  hover:bg-red-500/20  aria-pressed:bg-red-500/30',
  na:  'border-slate-400 text-slate-300 hover:bg-slate-500/20 aria-pressed:bg-slate-500/30',
}

function YesNoQuestion({ onAnswer, typingDone = true }: YesNoQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const options = DEFAULT_OPTIONS

  const handleSelect = (value: string) => {
    if (selected) return
    setSelected(value)
    onAnswer(value === 'yes')
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        className={[
          'flex gap-3 flex-wrap justify-center transition-all duration-300',
          typingDone ? 'opacity-100 translate-y-0 game-bounce-in' : 'opacity-0 translate-y-4 pointer-events-none',
        ].join(' ')}
      >
        {options.map((opt) => {
          const colorCls = OPTION_COLORS[opt.value] ?? OPTION_COLORS.na
          const isChosen = selected === opt.value
          return (
            <button
              key={opt.value}
              className={[
                'flex flex-col items-center gap-2 flex-1 px-4 py-5',
                'rounded-2xl border-2 font-sub font-bold text-base',
                'transition-all duration-150 active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                colorCls,
                isChosen ? 'scale-95 ring-2 ring-white/30' : '',
              ].join(' ')}
              onClick={() => handleSelect(opt.value)}
              disabled={!!selected}
              aria-label={opt.label}
              aria-pressed={isChosen}
            >
              <span className="text-3xl">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default YesNoQuestion
