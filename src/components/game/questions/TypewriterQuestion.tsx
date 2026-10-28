import { useState, useEffect, useRef } from 'react'

interface TypewriterQuestionProps {
  text?: string
  speed?: number
  onDone?: () => void
}

/** Texto de la pregunta. Se escribe rápido y un toque lo muestra completo. */
function TypewriterQuestion({ text = '', speed = 18, onDone }: TypewriterQuestionProps) {
  const [shown, setShown] = useState(0)
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone }, [onDone])

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !text) {
      setShown(text.length)
      onDoneRef.current?.()
      return
    }
    setShown(0)
    let i = 0
    const id = setInterval(() => {
      i++
      setShown(i)
      if (i >= text.length) {
        clearInterval(id)
        onDoneRef.current?.()
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  const typing = shown < text.length

  return (
    <p
      className="font-display font-extrabold text-[38px] leading-[1.02] text-[var(--fg)] m-0"
      onClick={() => { if (typing) { setShown(text.length); onDoneRef.current?.() } }}
      aria-label={text}
    >
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      {typing && <span className="game-cursor inline-block w-[4px] h-8 bg-[var(--fg)] ml-0.5 align-middle" aria-hidden="true" />}
    </p>
  )
}

export default TypewriterQuestion
