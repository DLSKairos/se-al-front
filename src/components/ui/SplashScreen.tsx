import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MAX_WAIT_MS = 2200

interface SplashScreenProps {
  onDone: () => void
}

/** Pantalla de arranque: la marca como un cartel de obra sobre cinta de precaución. */
export function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true)
  const doneRef = useRef(false)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    setVisible(false)
    setTimeout(onDone, 400)
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
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--brand)] cursor-pointer select-none overflow-hidden"
          onClick={finish}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') finish() }}
          aria-label="Entrar a SEÑAL"
        >
          <div className="hazard absolute inset-x-0 top-0 h-5" aria-hidden="true" />
          <div className="hazard absolute inset-x-0 bottom-0 h-5" aria-hidden="true" />

          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-3 px-6"
          >
            <span className="font-display font-extrabold text-[#17160F] leading-[0.85] tracking-[0.06em] text-[clamp(84px,26vw,148px)]">
              SEÑAL
            </span>
            <span className="font-body font-semibold text-[#17160F] text-lg text-center">
              Tu operación en movimiento, siempre.
            </span>
          </motion.div>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="absolute bottom-14 font-body font-semibold text-[#17160F]/80 text-base"
          >
            Toca para entrar
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
