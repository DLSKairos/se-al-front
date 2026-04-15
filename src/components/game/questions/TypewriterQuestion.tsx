import { useState, useEffect, useRef } from 'react'

interface TypewriterQuestionProps {
  text?: string
  speed?: number
  onDone?: () => void
}

function TypewriterQuestion({ text = '', speed = 50, onDone }: TypewriterQuestionProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  const onDoneRef   = useRef(onDone)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { onDoneRef.current = onDone }, [onDone])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDisplayedText('')
    setIsTyping(true)

    let i = 0

    intervalRef.current = setInterval(() => {
      i++
      setDisplayedText(text.slice(0, i))

      if (i >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsTyping(false)
        onDoneRef.current?.()
      }
    }, speed)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed])

  return (
    <p className="text-[var(--off-white)] text-base leading-relaxed font-['DM_Sans'] m-0">
      {displayedText}
      {isTyping && (
        <span
          className="game-cursor inline-block w-0.5 h-4 bg-[var(--signal)] ml-0.5 align-middle"
          aria-hidden="true"
        />
      )}
    </p>
  )
}

export default TypewriterQuestion
