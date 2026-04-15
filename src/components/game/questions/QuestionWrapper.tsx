/**
 * QuestionWrapper — orquestador de preguntas con flip 3D
 *
 * Props:
 *   questions    array   — preguntas de la sección
 *   onComplete   fn      — (answers: object) => void  al terminar todas
 *   sectionName  string  — nombre de la sección (para aria)
 *   timerConfig  object? — { duration: number }
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import YesNoQuestion       from './YesNoQuestion'
import MultiSelectQuestion from './MultiSelectQuestion'
import TimeRegister        from './TimeRegister'
import TimerChallenge      from './TimerChallenge'
import MicroCelebration    from './MicroCelebration'
import TextInputQuestion   from './TextInputQuestion'
import InventoryItemQuestion from './InventoryItemQuestion'

const FLIP_DURATION = 350

interface Question {
  id:             string
  type?:          string
  question:       string
  icon?:          string
  critical?:      boolean
  fieldName?:     string
  customOptions?: Array<{ value: string; label: string; icon?: string; negative?: boolean }>
  options?:       Array<{ value: string; label: string; icon?: string }>
  placeholder?:   string
  min?:           number | string
  max?:           number | string
  minSelections?: number
  maxSelections?: number
  label?:         string
}

interface QuestionWrapperProps {
  questions:   Question[]
  onComplete:  (answers: Record<string, unknown>) => void
  sectionName?: string
  timerConfig?: { duration: number; onExpire?: () => void } | null
}

function QuestionWrapper({
  questions = [],
  onComplete,
  sectionName = '',
  timerConfig = null,
}: QuestionWrapperProps) {
  const [currentIndex,    setCurrentIndex]    = useState(0)
  const [phase,           setPhase]           = useState<'enter' | 'idle' | 'exit' | 'celebrating'>('enter')
  const [celebrationType, setCelebrationType] = useState<'positive' | 'negative' | 'neutral'>('positive')

  const answersRef      = useRef<Record<string, unknown>>({})
  const currentIdxRef   = useRef(0)
  const onCompleteRef   = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])
  useEffect(() => { currentIdxRef.current = currentIndex }, [currentIndex])

  useEffect(() => {
    setPhase('enter')
    const t = setTimeout(
      () => setPhase((prev) => (prev === 'enter' ? 'idle' : prev)),
      FLIP_DURATION,
    )
    return () => clearTimeout(t)
  }, [currentIndex])

  const handleAnswer = useCallback((questionId: string, value: unknown, extraAnswers: Record<string, unknown> = {}) => {
    answersRef.current = { ...answersRef.current, [questionId]: value, ...extraAnswers }

    setCelebrationType(
      value === 'yes' ? 'positive'
      : value === 'no' ? 'negative'
      : 'neutral'
    )

    setPhase('exit')
    setTimeout(() => setPhase('celebrating'), FLIP_DURATION)
  }, [])

  const handleCelebrationDone = useCallback(() => {
    const next = currentIdxRef.current + 1
    if (next >= questions.length) {
      setTimeout(() => onCompleteRef.current?.(answersRef.current), 0)
    } else {
      setCurrentIndex(next)
    }
  }, [questions.length])

  const current = questions[currentIndex]
  if (!current) return null

  const progress = (currentIndex / questions.length) * 100

  return (
    <div
      className="relative w-full min-h-full flex flex-col items-center px-4 pt-3 pb-8 gap-4"
      aria-label={sectionName || 'Preguntas'}
    >
      {timerConfig && (
        <div className="absolute top-2.5 right-3 z-10">
          <TimerChallenge
            duration={timerConfig.duration}
            onExpire={timerConfig.onExpire}
          />
        </div>
      )}

      <div
        className="flex items-center gap-3 w-full max-w-[480px]"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-label={`Pregunta ${currentIndex + 1} de ${questions.length}`}
      >
        <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-[var(--signal)] rounded-full transition-[width] duration-400"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>
        <span className="text-sm font-bold text-white/85 whitespace-nowrap min-w-[40px] text-right font-['Syne']">
          {currentIndex + 1}
          <span className="mx-0.5 opacity-60">/</span>
          {questions.length}
        </span>
      </div>

      <div
        className="perspective-[1000px] w-full max-w-[480px] flex-1 flex items-start justify-center"
      >
        <div
          className={[
            'w-full will-change-transform',
            phase === 'exit'  ? 'game-flip-exit'  : '',
            phase === 'enter' ? 'game-flip-enter' : '',
          ].filter(Boolean).join(' ')}
        >
          {(current.type === 'yesno' || !current.type) && (
            <YesNoQuestion
              key={current.id}
              question={current as Parameters<typeof YesNoQuestion>[0]['question']}
              onAnswer={() => {}}
              onAnswerLegacy={handleAnswer}
            />
          )}

          {current.type === 'multiselect' && (
            <MultiSelectQuestion
              key={current.id}
              question={current as Parameters<typeof MultiSelectQuestion>[0]['question']}
              onAnswer={() => {}}
              onAnswerLegacy={handleAnswer}
            />
          )}

          {current.type === 'time' && (
            <TimeRegister
              key={current.id}
              question={current as Parameters<typeof TimeRegister>[0]['question']}
              onAnswer={handleAnswer}
            />
          )}

          {(current.type === 'text' || current.type === 'number' || current.type === 'date') && (
            <TextInputQuestion
              key={current.id}
              question={current as Parameters<typeof TextInputQuestion>[0]['question']}
              onAnswer={() => {}}
              onAnswerLegacy={handleAnswer}
            />
          )}

          {current.type === 'inventory-item' && (
            <InventoryItemQuestion
              key={current.id}
              question={current as Parameters<typeof InventoryItemQuestion>[0]['question']}
              onAnswer={handleAnswer}
            />
          )}

          {current.type &&
            !['yesno', 'multiselect', 'time', 'text', 'number', 'date', 'inventory-item'].includes(current.type) && (
            <div className="glass-card-md p-6 text-center">
              <p className="text-[var(--off-white)] text-base leading-relaxed mb-6 font-['DM_Sans']">
                {current.question}
              </p>
              <button
                className="px-6 py-2.5 rounded-xl bg-white/15 border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/25 transition-colors font-['Syne']"
                onClick={() => handleAnswer(current.id, null)}
              >
                Continuar →
              </button>
            </div>
          )}
        </div>
      </div>

      <MicroCelebration
        show={phase === 'celebrating'}
        type={celebrationType}
        onDone={handleCelebrationDone}
      />
    </div>
  )
}

export default QuestionWrapper
