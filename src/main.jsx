import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import AdminGuard          from "./components/admin/layout/AdminGuard";
import AdminLayout         from "./components/admin/layout/AdminLayout";
import AdminDashboard      from "./components/admin/pages/AdminDashboard";
import AdminPermisosPanel  from "./components/admin/pages/AdminPermisos";
import AdminUsuariosPanel  from "./components/admin/pages/AdminUsuarios";
import AdminObrasPanel     from "./components/admin/pages/AdminObras";
import AdminChatPanel      from "./components/admin/pages/AdminChat";
import Footer from "./components/Footer";
import PermisoTrabajo from "./components/compartido/permiso_trabajo";
import HoraIngreso from "./components/compartido/horada_ingreso";
import HoraSalida from "./components/compartido/hora_salida";
import CedulaIngreso from "./CedulaIngreso";
import BienvenidaSeleccion from "./BienvenidaSeleccion";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import RegistrosDiariosAdmin from './components/administrador/RegistrosDiariosAdmin';
import GameFlow     from './components/game/GameFlow';
import LevelWrapper from './components/game/LevelWrapper';

/**
 * Resuelve el nombre del trabajador y la obra activa desde localStorage,
 * admitiendo tanto cadenas simples como objetos serializados en JSON.
 *
 * @returns {{ usuario: string, obra: string }}
 */
function getUsuarioObra() {
  let usuario = "";
  let obra = "";

  const nombreTrabajador = localStorage.getItem("nombre_trabajador");
  if (nombreTrabajador && nombreTrabajador.trim()) {
    usuario = nombreTrabajador;
  } else {
    const usuarioStorage = localStorage.getItem("usuario");
    if (usuarioStorage) {
      try {
        const usuarioParsed = JSON.parse(usuarioStorage);
        if (usuarioParsed && typeof usuarioParsed === "object" && usuarioParsed.nombre) {
          usuario = usuarioParsed.nombre;
        } else if (typeof usuarioParsed === "string") {
          usuario = usuarioParsed;
        } else {
          usuario = usuarioStorage;
        }
      } catch {
        usuario = usuarioStorage;
      }
    }
  }

  const obraStorage = localStorage.getItem("obra");
  if (obraStorage && obraStorage.trim()) {
    obra = obraStorage;
  } else {
    const nombreProyecto = localStorage.getItem("nombre_proyecto");
    if (nombreProyecto && nombreProyecto.trim()) {
      obra = nombreProyecto;
    } else {
      try {
        const obraParsed = JSON.parse(obraStorage);
        if (obraParsed && typeof obraParsed === "object" && obraParsed.nombre) {
          obra = obraParsed.nombre;
        } else if (typeof obraParsed === "string") {
          obra = obraParsed;
        }
      } catch {
        obra = obraStorage;
      }
    }
  }

  return { usuario, obra };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

/**
 * Se suscribe a cambios en el ancho del viewport y retorna true cuando
 * este es menor a 600 px (punto de quiebre para móviles).
 *
 * @returns {boolean}
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 600 : true
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 599px)");
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return isMobile;
}

/**
 * Hook de arrastre para botones flotantes.
 * Persiste la posición en localStorage. Distingue tap de drag (umbral 5px).
 * @param {string} storageKey - clave para localStorage
 * @param {() => {x: number, y: number}} defaultPos - función que retorna posición por defecto
 */
function useDraggable(defaultPos) {
  const [pos, setPos] = React.useState(() => defaultPos());

  const posRef = React.useRef(pos);
  React.useEffect(() => { posRef.current = pos; }, [pos]);

  const dragging = React.useRef(false);
  const startPtr = React.useRef({ x: 0, y: 0 });
  const startPos = React.useRef({ x: 0, y: 0 });
  const wasDragged = React.useRef(false);

  const onPointerDown = React.useCallback((e) => {
    dragging.current = true;
    wasDragged.current = false;
    startPtr.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...posRef.current };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = React.useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - startPtr.current.x;
    const dy = e.clientY - startPtr.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) wasDragged.current = true;
    if (!wasDragged.current) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 64, startPos.current.x + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 64, startPos.current.y + dy));
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = React.useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    // posición no persiste — vuelve al default al reabrir la app
  }, []);

  const onClickCapture = React.useCallback((e) => {
    if (wasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
      wasDragged.current = false;
    }
  }, []);

  return { pos, onPointerDown, onPointerMove, onPointerUp, onClickCapture };
}

/**
 * Botón flotante de emergencia visible únicamente en móvil.
 *
 * Presenta un modal con opciones de llamada y WhatsApp. La opción de WhatsApp
 * enruta al usuario según su rol (Bomberman / Gruaman) y, para Bomberman,
 * permite seleccionar el grupo regional. Copia un mensaje SOS preformateado
 * al portapapeles antes de abrir la URL del grupo de WhatsApp.
 */
function SOSButton() {
  const isMobile = useIsMobile();
  const [enviando, setEnviando] = React.useState(false);
  const [mensaje, setMensaje] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [showRegionModal, setShowRegionModal] = React.useState(false);
  const { pos: sosPos, onPointerDown: sosDown, onPointerMove: sosMove, onPointerUp: sosUp, onClickCapture: sosClickCapture } =
    useDraggable(() => ({ x: 14, y: window.innerHeight - 144 }));

  if (!isMobile) return null;

  function getUsuarioObra() {
    let usuario = "";
    let obra = "";
    const nombreTrabajador = localStorage.getItem("nombre_trabajador");
    if (nombreTrabajador && nombreTrabajador.trim()) {
      usuario = nombreTrabajador;
    } else {
      const usuarioStorage = localStorage.getItem("usuario");
      if (usuarioStorage) {
        try {
          const usuarioParsed = JSON.parse(usuarioStorage);
          if (usuarioParsed && typeof usuarioParsed === "object" && usuarioParsed.nombre) {
            usuario = usuarioParsed.nombre;
          } else if (typeof usuarioParsed === "string") {
            usuario = usuarioParsed;
          } else {
            usuario = usuarioStorage;
          }
        } catch {
          usuario = usuarioStorage;
        }
      }
    }
    const obraStorage = localStorage.getItem("obra");
    if (obraStorage && obraStorage.trim()) {
      obra = obraStorage;
    } else {
      const nombreProyecto = localStorage.getItem("nombre_proyecto");
      if (nombreProyecto && nombreProyecto.trim()) {
        obra = nombreProyecto;
      } else {
        try {
          const obraParsed = JSON.parse(obraStorage);
          if (obraParsed && typeof obraParsed === "object" && obraParsed.nombre) {
            obra = obraParsed.nombre;
          } else if (typeof obraParsed === "string") {
            obra = obraParsed;
          }
        } catch {
          obra = obraStorage;
        }
      }
    }
    return { usuario, obra };
  }

  const handleSOS = () => {
    setShowModal(true);
    setMensaje("");
  };

  const handleLlamar = () => {
    setShowModal(false);
    window.location.href = "";
  };

  const handleWhatsApp = () => {
    setShowModal(false);
    setShowRegionModal(true);
    setMensaje("");
  };

  /**
   * Copia el mensaje de incidente al portapapeles y abre la URL del grupo
   * regional de WhatsApp.
   * @param {string} regionUrl - Enlace profundo al grupo de WhatsApp de destino.
   */
  const handleRegion = (regionUrl) => {
    setShowRegionModal(false);
    const { usuario, obra } = getUsuarioObra();
    const mensajeRegion = `Soy ${usuario || "un usuario"} en la obra ${obra || "desconocida"}, tuve un accidente o incidente`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mensajeRegion);
      setTimeout(() => {
        window.location.href = regionUrl;
      }, 300);
      setMensaje("Mensaje copiado. Pega el mensaje en el grupo de WhatsApp.");
    } else {
      window.location.href = regionUrl;
      setMensaje("Copia y pega este mensaje en el grupo: " + mensajeRegion);
    }
    setTimeout(() => setMensaje(""), 3000);
  };

  return (
    <>
      <button
        style={{
          position: "fixed",
          left: sosPos.x,
          top: sosPos.y,
          zIndex: 1000,
          borderRadius: "50%",
          width: 64,
          height: 64,
          background: "#c00",
          color: "#fff",
          border: "none",
          fontSize: 24,
          fontWeight: "bold",
          boxShadow: "0 2px 12px #c00",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          lineHeight: "1",
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={sosDown}
        onPointerMove={sosMove}
        onPointerUp={sosUp}
        onClickCapture={sosClickCapture}
        onClick={handleSOS}
        disabled={enviando}
        title="SOS Emergencia"
      >
        <span style={{ fontSize: 24, fontWeight: "bold", color: "#fff", letterSpacing: 2 }}>SOS</span>
      </button>
     {showModal && (
       <div
         style={{
           position: "fixed",
           left: 0,
           top: 0,
           width: "100vw",
           height: "100vh",
           background: "rgba(0,0,0,0.25)",
           zIndex: 2000,
           display: "flex",
           alignItems: "center",
           justifyContent: "center"
         }}
         onClick={() => setShowModal(false)}
       >
         <div
           style={{
             background: "#fff",
             borderRadius: 14,
             boxShadow: "0 2px 12px #c00",
             padding: "24px 18px",
             minWidth: 220,
             display: "flex",
             flexDirection: "column",
             gap: 16,
             alignItems: "center"
           }}
           onClick={e => e.stopPropagation()}
         >
           <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>¿Qué deseas hacer?</div>
           <button
             className="permiso-trabajo-btn"
             style={{ background: "#c00", color: "#fff", minWidth: 120, fontWeight: 600 }}
             onClick={handleLlamar}
           >
             Llamar
           </button>
           <button
             className="permiso-trabajo-btn"
             style={{ background: "#25D366", color: "#fff", minWidth: 120, fontWeight: 600 }}
             onClick={handleWhatsApp}
           >
             Escribir mensaje
           </button>
           <button
             className="permiso-trabajo-btn"
             style={{ background: "#eee", color: "#222", minWidth: 120, fontWeight: 600 }}
             onClick={() => setShowModal(false)}
           >
             Cancelar
           </button>
         </div>
       </div>
     )}
    {showRegionModal && (
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.25)",
          zIndex: 2050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onClick={() => setShowRegionModal(false)}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 2px 12px #c00",
            padding: "18px",
            minWidth: 260,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center"
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontWeight: 600, fontSize: 16 }}>Elige la región</div>
          <button
            className="permiso-trabajo-btn"
            style={{ background: "#1976d2", color: "#fff", minWidth: 160, fontWeight: 600 }}
            onClick={() => handleRegion('')}
          >
            Cundinamarca
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ background: "#1976d2", color: "#fff", minWidth: 160, fontWeight: 600 }}
            onClick={() => handleRegion('')}
          >
            Antioquia
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ background: "#1976d2", color: "#fff", minWidth: 160, fontWeight: 600 }}
            onClick={() => handleRegion('')}
          >
            Atlantico
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ background: "#eee", color: "#222", minWidth: 120, fontWeight: 600 }}
            onClick={() => setShowRegionModal(false)}
          >
            Cancelar
          </button>
        </div>
      </div>
    )}
      {mensaje && (
        <div
          style={{
            position: "fixed",
            left: 14,
            bottom: "150px",
            zIndex: 1100,
            background: "#fff",
            border: "2px solid #c00",
            borderRadius: 12,
            padding: "8px 16px",
            boxShadow: "0 2px 8px #c00",
            minWidth: 220,
            color: mensaje.includes("Error") ? "#c00" : "#1976d2",
            fontWeight: "bold",
            textAlign: "center"
          }}
        >
          {mensaje}
        </div>
      )}
    </>
  );
}


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(registration => {
        registration.update();
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {});
        });
      })
      .catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <div
        style={{
          minHeight: "100vh",
          minWidth: "100vw",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
            backgroundImage: "url('/fondo.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
        <div className="global-clouds" aria-hidden="true">
          <span className="global-cloud global-cloud--1">☁️</span>
          <span className="global-cloud global-cloud--2">☁️</span>
          <span className="global-cloud global-cloud--3">☁️</span>
          <span className="global-cloud global-cloud--4">☁️</span>
        </div>
        <SOSButton />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Routes>
            <Route path="/game/rotate-screen" element={<GameFlow key="rotate" step="rotate" />} />
            <Route path="/game/story-intro"   element={<GameFlow key="story"  step="story"  />} />
            <Route path="/game/world-map"     element={<GameFlow key="map"    step="map"    />} />
            <Route path="/game/level/:worldId" element={<LevelWrapper />} />

            <Route path="/" element={<App />} />
            <Route path="/cedula" element={<CedulaIngreso />} />
            <Route path="/bienvenida" element={<BienvenidaSeleccion usuario={{ nombre: "Invitado", empresa: "" }} />} />
            <Route path="/permiso_trabajo" element={<PermisoTrabajo />} />
            <Route path="/hora_ingreso" element={<HoraIngreso />} />
            <Route path="/hora_salida" element={<HoraSalida />} />
            <Route path="/registros_diarios_admin" element={<RegistrosDiariosAdmin />} />

            {/* ── Nuevo panel admin /admin ── */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="permisos" element={<AdminPermisosPanel />} />
                <Route path="usuarios" element={<AdminUsuariosPanel />} />
                <Route path="obras"    element={<AdminObrasPanel />} />
                <Route path="chat"     element={<AdminChatPanel />} />
              </Route>
            </Route>
          </Routes>
          {/* <Footer /> */}
        </div>
      </div>
    </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);


