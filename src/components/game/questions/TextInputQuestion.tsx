/**
 * TextInputQuestion — campo grande con botón de confirmar a todo el ancho
 */
import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'

interface TextInputQuestionProps {
  type?: 'text' | 'number' | 'date' | 'datetime-local'
  required?: boolean
  placeholder?: string
  typingDone?: boolean
  onAnswer: (value: string) => void
}

function TextInputQuestion({
  type = 'text',
  required = false,
  placeholder: propPlaceholder,
  typingDone = true,
  onAnswer,
}: TextInputQuestionProps) {
  const [value,     setValue]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typingDone) inputRef.current?.focus()
  }, [typingDone])

  const placeholder = propPlaceholder ?? (type === 'number' ? '0' : '')
  const canSubmit = !required || !!value.trim()

  const handleSubmit = () => {
    if (submitted || !canSubmit) return
    setSubmitted(true)
    onAnswer(value)
  }

  return (
    <div className={`flex flex-col gap-3 w-full ${typingDone ? 'game-bounce-in' : 'opacity-0 pointer-events-none'}`}>
      <input
        ref={inputRef}
        className="w-full min-h-[72px] px-5 rounded-[20px] border-[3px] border-[var(--fg)] bg-[var(--surface)] text-[var(--fg)] font-body font-semibold text-2xl placeholder:text-[var(--fg-muted)] placeholder:font-normal outline-none focus:ring-4 focus:ring-[color:var(--wash-brand)] disabled:opacity-60"
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        placeholder={placeholder}
        disabled={submitted}
        aria-label="Respuesta"
        required={required}
      />
      <button className="btn-3d w-full" onClick={handleSubmit} disabled={submitted || !canSubmit} aria-label="Confirmar respuesta">
        {submitted ? <><Check className="w-6 h-6" strokeWidth={3.5} /> Guardado</> : 'Confirmar'}
      </button>
    </div>
  )
}

export default TextInputQuestion
