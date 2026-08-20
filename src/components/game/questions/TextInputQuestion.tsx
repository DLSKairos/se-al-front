/**
 * TextInputQuestion — campo de texto grande con botón "Comprobar" full-width
 *
 * Props:
 *   type        'text' | 'number' | 'date' | 'datetime-local'
 *   required    boolean
 *   placeholder string
 *   typingDone  boolean — controlado por LevelWrapper
 *   onAnswer    (value: string) => void
 */
import { useState, useRef, useEffect } from 'react'

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
    if (typingDone && inputRef.current) {
      inputRef.current.focus()
    }
  }, [typingDone])

  const placeholder = propPlaceholder
    ?? (type === 'number' ? '0' : type === 'date' ? 'YYYY-MM-DD' : '')

  const handleSubmit = () => {
    if (submitted) return
    if (required && !value.trim()) return
    setSubmitted(true)
    onAnswer(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const canSubmit = !required || !!value.trim()

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        className={[
          'flex flex-col gap-3 w-full transition-all duration-300',
          typingDone ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          className={[
            'w-full px-5 py-4 rounded-2xl border-2 font-dm text-base',
            'bg-[rgba(255,255,255,0.05)] text-[var(--cream)]',
            'placeholder:text-[rgba(250,244,232,0.3)] outline-none',
            'transition-colors',
            submitted
              ? 'border-white/10 opacity-60'
              : 'border-white/15 focus:border-[var(--signal)] focus:bg-[rgba(0,212,255,0.04)]',
          ].join(' ')}
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={submitted}
          aria-label="Respuesta"
          required={required}
        />

        <button
          className={[
            'w-full py-4 rounded-2xl font-sub font-bold text-base tracking-wide uppercase',
            'transition-all duration-200 active:scale-[0.98]',
            submitted
              ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30'
              : !canSubmit
              ? 'bg-white/10 text-[var(--muted)] cursor-not-allowed'
              : 'bg-[var(--terracotta)] text-[var(--cream)] hover:opacity-90',
          ].join(' ')}
          onClick={handleSubmit}
          disabled={submitted}
          aria-label="Confirmar respuesta"
        >
          {submitted ? '✓ Guardado' : 'Comprobar'}
        </button>
      </div>
    </div>
  )
}

export default TextInputQuestion
