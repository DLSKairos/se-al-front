import React, { useState, useEffect } from "react";
import CedulaIngreso from "./CedulaIngreso";
import BienvenidaSeleccion from "./BienvenidaSeleccion";
import "./App.css";
import InstallPWAButton from "./components/InstallPWAButton";
import IntroVideo from "./components/IntroVideo";
import SlowConnectionBanner from "./components/SlowConnectionBanner";
import { subscribeUser } from "./pushNotifications";

/**
 * Componente raíz de la aplicación, renderizado en la ruta "/".
 *
 * Gestiona el flujo de autenticación e intro-video en el nivel superior:
 * - Muestra IntroVideo en la primera carga (omitido en modo lite).
 * - Al terminar el video, renderiza CedulaIngreso para autenticación y
 *   luego transiciona a BienvenidaSeleccion tras un inicio de sesión exitoso.
 * - Suscribe al trabajador autenticado a las notificaciones push.
 * - Muestra SlowConnectionBanner cuando el video de intro supera el tiempo límite,
 *   ofreciendo al usuario un modo lite (sin animaciones).
 */
function App() {
  const [usuario, setUsuario] = useState(null);

  const isLiteMode = sessionStorage.getItem('lite_mode') === 'true';

  const [showIntro,      setShowIntro]      = useState(!isLiteMode);
  const [showLiteBanner, setShowLiteBanner] = useState(false);

  const trabajadorId = usuario?.id;
  useEffect(() => {
    if (trabajadorId && 'serviceWorker' in navigator && 'PushManager' in window) {
      subscribeUser(trabajadorId).catch(() => {});
    }
  }, [trabajadorId]);

  const handleIntroEnd = () => setShowIntro(false);

  const handleSlowDetected = () => {
    if (!isLiteMode) setShowLiteBanner(true);
  };

  const handleUseLite = () => {
    sessionStorage.setItem('lite_mode', 'true');
    setShowLiteBanner(false);
  };

  const handleDismissBanner = () => setShowLiteBanner(false);

  return (
    <div className="App">
      {showIntro && (
        <IntroVideo
          onVideoEnd={handleIntroEnd}
          onSlowDetected={handleSlowDetected}
        />
      )}
      {!showIntro && (
        <>
          {!usuario ? (
            <CedulaIngreso onUsuarioEncontrado={setUsuario} />
          ) : (
            <BienvenidaSeleccion usuario={usuario} />
          )}
        </>
      )}
      {showLiteBanner && (
        <SlowConnectionBanner
          onUseLite={handleUseLite}
          onDismiss={handleDismissBanner}
        />
      )}
      <InstallPWAButton />
    </div>
  );
}

export default App;