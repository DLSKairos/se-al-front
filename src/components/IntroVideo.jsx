import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MAX_WAIT_MS = 2800;

/**
 * Splash screen animada con identidad SEÑAL que reemplaza el video introductorio.
 *
 * Mantiene la misma interfaz de props que el componente de video original:
 * se auto-descarta tras MAX_WAIT_MS o al hacer clic, y notifica al padre
 * mediante onVideoEnd (y opcionalmente onSlowDetected).
 *
 * @param {Object} props
 * @param {Function} props.onVideoEnd - Se llama cuando la splash termina o es omitida.
 * @param {Function} [props.onSlowDetected] - Se llama cuando se infiere una conexión lenta.
 */
function IntroVideo({ onVideoEnd, onSlowDetected }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const escapedRef = useRef(false);

  const escape = (slow = false) => {
    if (escapedRef.current) return;
    escapedRef.current = true;
    setFadeOut(true);
    setTimeout(() => {
      setIsPlaying(false);
      onVideoEnd();
      if (slow) onSlowDetected?.();
    }, 500);
  };

  useEffect(() => {
    const timer = setTimeout(() => escape(false), MAX_WAIT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isPlaying) return null;

  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#0C1624",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            backgroundImage:
              "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          onClick={() => escape(false)}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            style={{ display: "flex", alignItems: "center", gap: "14px" }}
          >
            <motion.span
              animate={{
                boxShadow: [
                  "0 0 6px rgba(0,212,255,0.35)",
                  "0 0 22px rgba(0,212,255,0.85)",
                  "0 0 6px rgba(0,212,255,0.35)",
                ],
              }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#00D4FF",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(52px, 12vw, 80px)",
                color: "#F0F4F8",
                letterSpacing: "0.08em",
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
            style={{
              fontFamily: "'Fraunces', serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(14px, 3.5vw, 18px)",
              color: "rgba(240,244,248,0.5)",
              margin: 0,
              letterSpacing: "0.04em",
            }}
          >
            Tu operación en movimiento, siempre.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default IntroVideo;
