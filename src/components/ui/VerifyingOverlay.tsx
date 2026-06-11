import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface VerifyingOverlayProps {
  visible: boolean
  variant?: 'fullscreen' | 'partial'
  message?: string
}

// ── Subcomponente: barra de progreso indeterminada ────────────────────────────

function IndeterminateBar() {
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: 'var(--signal)' }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ── Subcomponente: escudo animado (variante partial) ──────────────────────────

function AnimatedShield() {
  return (
    <motion.div
      className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-4"
      style={{ background: 'rgba(0,212,255,0.12)', border: '1.5px solid rgba(0,212,255,0.3)' }}
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ShieldCheck className="w-8 h-8" style={{ color: 'var(--signal)' }} />
    </motion.div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

/**
 * VerifyingOverlay — overlay de verificación/seguridad
 *
 * Variantes:
 * - fullscreen: pantalla completa navy, logo SEÑAL, barra de progreso.
 *   Aparece mientras se carga la sesión al inicio de la app.
 * - partial: overlay absoluto sobre el contenedor padre (el padre debe tener
 *   `position: relative`). Escudo animado, texto de seguridad.
 *   Ideal para cubrir un formulario o sección durante envíos.
 *
 * Props:
 *   visible  — controla si el overlay está montado (AnimatePresence)
 *   variant  — 'fullscreen' (default) | 'partial'
 *   message  — texto principal (overrides el texto por defecto)
 */
export default function VerifyingOverlay({
  visible,
  variant = 'fullscreen',
  message,
}: VerifyingOverlayProps) {
  // Si el overlay lleva más de 4s visible, mostrar mensaje de tardanza
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!visible) {
      setSlow(false)
      return
    }
    const t = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(t)
  }, [visible])

  // ── Variante fullscreen ───────────────────────────────────────────────────
  if (variant === 'fullscreen') {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            key="verifying-fullscreen"
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
            style={{
              background: 'var(--navy)',
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            transition={{ duration: 0.2 }}
          >
            {/* Logo SEÑAL */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.4 }}
              className="flex flex-col items-center mb-10"
            >
              {/* Wordmark */}
              <span
                className="font-display font-extrabold text-4xl tracking-tight leading-none"
                style={{ color: 'var(--off-white)' }}
              >
                SE
                <span style={{ color: 'var(--signal)' }}>Ñ</span>
                AL
              </span>
              <span
                className="font-dm text-[11px] tracking-[0.3em] uppercase mt-1"
                style={{ color: 'var(--signal)' }}
              >
                Kairos
              </span>
            </motion.div>

            {/* Mensaje principal */}
            <motion.p
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="font-display font-semibold text-xl text-center mb-2"
              style={{ color: 'var(--off-white)' }}
            >
              {message ?? 'Verificando tu información...'}
            </motion.p>

            {/* Mensaje de tardanza */}
            <AnimatePresence>
              {slow && (
                <motion.p
                  key="slow-msg"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="font-dm text-sm text-center mb-6"
                  style={{ color: 'var(--muted)' }}
                >
                  Esto está tardando más de lo habitual...
                </motion.p>
              )}
            </AnimatePresence>

            {!slow && <div className="mb-6" />}

            {/* Barra de progreso */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="w-48"
            >
              <IndeterminateBar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // ── Variante partial ──────────────────────────────────────────────────────
  // NOTA: el contenedor padre DEBE tener `position: relative` (e.g. className="relative")
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="verifying-partial"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-inherit"
          style={{
            background: 'rgba(12,22,36,0.88)',
            backdropFilter: 'blur(6px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.15 }}
        >
          <AnimatedShield />
          <p
            className="font-display font-semibold text-base text-center px-6"
            style={{ color: 'var(--off-white)' }}
          >
            {message ?? 'Registrando tu información de forma segura...'}
          </p>
          <div className="mt-5 w-32">
            <IndeterminateBar />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
