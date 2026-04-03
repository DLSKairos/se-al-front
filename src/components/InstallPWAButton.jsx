import React, { useEffect, useState } from "react";

/**
 * Botón flotante "Instalar App" visible únicamente en móvil cuando el navegador
 * dispara el evento beforeinstallprompt.
 *
 * Captura el prompt diferido, se oculta después de que el usuario responde
 * y desaparece en viewports de más de 600 px de ancho.
 */
function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const resizeHandler = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setVisible(false);
    }
  };

  if (!visible || !isMobile) return null;

  return (
    <button
      onClick={handleInstall}
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "#00D4FF",
        color: "#0C1624",
        border: "none",
        borderRadius: 8,
        padding: "12px 20px",
        boxShadow: "0 0 16px rgba(0,212,255,0.4)",
        fontSize: 16,
        cursor: "pointer",
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700
      }}
    >
      Instalar App
    </button>
  );
}

export default InstallPWAButton;
