import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MAX_WAIT_MS = 2800

interface SplashScreenProps {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true)
  const doneRef = useRef(false)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    setVisible(false)
    setTimeout(onDone, 500)
  }

  useEffect(() => {
    const t = setTimeout(finish, MAX_WAIT_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 cursor-pointer select-none"
          style={{
            background: '#0C1624',
            backgroundImage:
              'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          onClick={finish}
          aria-label="Pantalla de inicio"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            className="flex items-center gap-3"
          >
            <motion.span
              animate={{
                boxShadow: [
                  '0 0 6px rgba(0,212,255,0.35)',
                  '0 0 22px rgba(0,212,255,0.85)',
                  '0 0 6px rgba(0,212,255,0.35)',
                ],
              }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="animate-pulse-dot"
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#00D4FF',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(52px, 12vw, 80px)',
                color: '#F0F4F8',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}
            >
              SEÑAL
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="font-serif italic font-light text-base text-[var(--muted)]"
            style={{
              margin: 0,
              letterSpacing: '0.04em',
            }}
          >
            Tu operación en movimiento, siempre.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="flex gap-1.5 mt-6"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
