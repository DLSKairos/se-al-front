import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import administrador from "../administrador_gruaman/administrador";
import "../../App.css";
import PermisoTrabajo from "../compartido/permiso_trabajo";
import ChequeoAlturas from "../compartido/chequeo_alturas";
import ChequeoTorreGruas from "./chequeo_torregruas";
import InspeccionEPCC from "./inspeccion_epcc";
import InspeccionIzaje from "./inspeccion_izaje";
import ChequeoElevador from "./chequeo_elevador";
import HoraIngreso from "../compartido/horada_ingreso";
import HoraSalida from "../compartido/hora_salida";
import { markWorldComplete } from '../../db/gameProgress';

/**
 * @param {string} usuario
 * @returns {Object} Map of worldId → boolean
 */
function getUsadosFromStorage(usuario) {
  try {
    const data = localStorage.getItem(`gruaman_usados_${usuario}`);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    hora_ingreso: false,
    permiso_trabajo: false,
    chequeo_alturas: false,
    chequeo_torregruas: false,
    chequeo_elevador: false,
    inspeccion_epcc: false,
    inspeccion_izaje: false,
    hora_salida: false
  };
}

function setUsadosToStorage(usados, usuario) {
  localStorage.setItem(`gruaman_usados_${usuario}`, JSON.stringify(usados));
}

function limpiarUsados(usuario) {
  localStorage.removeItem(`gruaman_usados_${usuario}`);
  localStorage.removeItem(`gruaman_usados_fecha_${usuario}`);
}

/** @returns {string} YYYY-MM-DD date in America/Bogota timezone */
function getTodayDateStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

const ATS_LIST = [
  { worldId: 'ats-operacion-torregrua',  label: 'Operación de Torre Grúa',                    icon: '🏗️' },
  { worldId: 'ats-mando-inalam',         label: 'Torre Grúa con Mando Inalámbrico desde Piso', icon: '📡' },
  { worldId: 'ats-montaje-torregrua',    label: 'Montaje de Torre Grúas',                      icon: '🔧' },
  { worldId: 'ats-montaje-elevador',     label: 'Montaje Elevador de Carga',                   icon: '🛗' },
  { worldId: 'ats-desmontaje-torregrua', label: 'Desmontaje de Torre Grúa',                    icon: '🔩' },
  { worldId: 'ats-telescopaje',          label: 'Telescopaje',                                 icon: '🔭' },
  { worldId: 'ats-mantenimiento',        label: 'Mantenimiento',                               icon: '⚙️' },
  { worldId: 'ats-elevador',             label: 'Elevador de Carga',                           icon: '⬆️' },
];

/**
 * Bienvenida — pantalla de selección de misiones para Gruaman.
 * Rastrea el uso diario de misiones por usuario; se reinicia a medianoche.
 * Incluye un submenú ATS para formularios de tareas especializadas.
 */
function Bienvenida() {
  const navigate = useNavigate();
  const [atsOpen, setAtsOpen] = useState(false);

  useEffect(() => {
    const worldId = localStorage.getItem('game_mode');
    if (worldId) {
      localStorage.removeItem('game_mode');
      markWorldComplete(worldId);
      navigate('/game/world-map', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nombre = localStorage.getItem("nombre_trabajador") || "";
  const usuario = nombre || "anonimo";
  const [usados, setUsados] = useState(() => getUsadosFromStorage(usuario));
  const [usuarioActual, setUsuarioActual] = useState(usuario);

  useEffect(() => {
    const fechaHoy = getTodayDateStr();
    const fechaGuardada = localStorage.getItem(`gruaman_usados_fecha_${usuarioActual}`);
    if (fechaGuardada !== fechaHoy) {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(usuarioActual));
      localStorage.setItem(`gruaman_usados_fecha_${usuarioActual}`, fechaHoy);
    }
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(usuarioActual));
      localStorage.setItem(`gruaman_usados_fecha_${usuarioActual}`, getTodayDateStr());
    }, msUntilMidnight);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [usuarioActual]);

  useEffect(() => {
    const nuevoUsuario = localStorage.getItem("nombre_trabajador") || "anonimo";
    if (nuevoUsuario !== usuarioActual) {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(nuevoUsuario));
      setUsuarioActual(nuevoUsuario);
    }
    // eslint-disable-next-line
  }, [localStorage.getItem("nombre_trabajador")]);

  useEffect(() => {
    setUsadosToStorage(usados, usuarioActual);
    localStorage.setItem(`gruaman_usados_fecha_${usuarioActual}`, getTodayDateStr());
  }, [usados, usuarioActual]);

  const handleNavigate = (ruta, key) => {
    setUsados(prev => {
      const nuevos = { ...prev, [key]: true };
      setUsadosToStorage(nuevos, usuarioActual);
      return nuevos;
    });
    navigate(ruta);
  };

  const getButtonClass = (usado) =>
    usado ? "button button-green" : "button";

  // Barra de progreso
  const total = Object.keys(usados).length;
  const completados = Object.values(usados).filter(Boolean).length;
  const porcentaje = Math.round((completados / total) * 100);

  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">
          Bienvenido Super Heroe{nombre ? ` ${nombre}` : ""}
        </h3>
        <div style={{ margin: "18px 0 24px 0" }}>
          <div style={{
            width: "100%",
            background: "#e0e0e0",
            borderRadius: 8,
            height: 18,
            position: "relative",
            marginBottom: 6,
            overflow: "hidden"
          }}>
            <div
              style={{
                width: `${porcentaje}%`,
                background: porcentaje === 100 ? "linear-gradient(90deg,#43a047,#66bb6a)" : "linear-gradient(90deg,#1976d2,#90caf9)",
                height: "100%",
                borderRadius: 8,
                transition: "width 0.4s cubic-bezier(.4,2,.3,1)"
              }}
            />
            <span style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              color: porcentaje === 100 ? "#fff" : "#222",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: 0.5
            }}>
              {porcentaje}%
            </span>
          </div>
          <div style={{ textAlign: "center", fontSize: 13, color: "#1976d2", fontWeight: 500 }}>
            {completados} de {total} formularios completados
          </div>
        </div>
        <p className="label" style={{ marginBottom: 20 }}>
          Selecciona el formulario que deseas usar:
        </p>
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          {/* Hora de ingreso - primero */}
          <button
            className={getButtonClass(usados.hora_ingreso)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/hora_ingreso", "hora_ingreso")}
          >
            Hora de Ingreso
          </button>
          <p className="label" style={{ marginBottom: 20,fontSize:20 }}>
            Diarios
          </p>
          <button
            className={getButtonClass(usados.permiso_trabajo)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/permiso_trabajo", "permiso_trabajo")}
          >
            Permiso de Trabajo
          </button>
          <p className="label" style={{ marginBottom: 20,fontSize:20 }}>
            Mensuales
          </p>
          <button
            className={getButtonClass(usados.chequeo_alturas)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/chequeo_alturas", "chequeo_alturas")}
          >
            Chequeo Alturas
          </button>
          <button
            className={getButtonClass(usados.chequeo_torregruas)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/chequeo_torregruas", "chequeo_torregruas")}
          >
            Chequeo Torre Grúa
          </button>
          <button
            className={getButtonClass(usados.chequeo_elevador)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/chequeo_elevador", "chequeo_elevador")}
          >
            Chequeo Elevador
          </button>
          <button
            className={getButtonClass(usados.inspeccion_epcc)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/inspeccion_epcc", "inspeccion_epcc")}
          >
            Inspección EPCC
          </button>
          <button
            className={getButtonClass(usados.inspeccion_izaje)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/inspeccion_izaje", "inspeccion_izaje")}
          >
            Inspección Izaje
          </button>
          {/* ATS expandable */}
          <button
            className="button"
            style={{
              maxWidth: 320,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#1a1a1a',
              fontWeight: 700,
              border: '2px solid #fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
            onClick={() => setAtsOpen(o => !o)}
          >
            <span>ATS — Análisis de Trabajo Seguro</span>
            <span style={{ fontSize: 12 }}>{atsOpen ? '▲' : '▼'}</span>
          </button>
          {atsOpen && (
            <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, paddingLeft: 12, borderLeft: '3px solid #f59e0b' }}>
              {ATS_LIST.map(ats => (
                <button
                  key={ats.worldId}
                  className="button"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#92400e', fontWeight: 600, fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={() => navigate(`/game/level/${ats.worldId}`)}
                >
                  <span>{ats.icon}</span>
                  <span>{ats.label}</span>
                </button>
              ))}
            </div>
          )}
          {/* Hora de salida - último */}
          <button
            className={getButtonClass(usados.hora_salida)}
            style={{ maxWidth: 320, marginTop: 16 }}
            onClick={() => handleNavigate("/hora_salida", "hora_salida")}
          >
            Hora de Salida
          </button>
          <button
            className="button"
            style={{
              maxWidth: 320,
              marginTop: 24,
              background: porcentaje === 100 ? "#ff9800" : "#bdbdbd",
              color: "#fff",
              fontWeight: 600,
              cursor: porcentaje === 100 ? "pointer" : "not-allowed",
              opacity: porcentaje === 100 ? 1 : 0.7
            }}
            disabled={porcentaje !== 100}
            onClick={() => {
              if (porcentaje === 100) {
                if (window.confirm("¿Estás seguro que deseas terminar? Esto reiniciará tu progreso.")) {
                  limpiarUsados(usuarioActual);
                  setUsados(getUsadosFromStorage(usuarioActual));
                }
              }
            }}
          >
            Terminar
          </button>
        </div>
      </div>
    </div>
  );
}

function eleccion() {
  return (
    <Routes>
      <Route path="/" element={<Bienvenida />} />
      <Route path="/formulario1" element={<formulario1 />} />
      <Route path="/administrador" element={<administrador />} />
      <Route path="/hora_ingreso" element={<HoraIngreso />} />
      <Route path="/permiso_trabajo" element={<PermisoTrabajo />} />
      <Route path="/chequeo_alturas" element={<ChequeoAlturas />} />
      <Route path="/chequeo_torregruas" element={<ChequeoTorreGruas />} />
      <Route path="/chequeo_elevador" element={<ChequeoElevador />} />
      <Route path="/inspeccion_epcc" element={<InspeccionEPCC />} />
      <Route path="/inspeccion_izaje" element={<InspeccionIzaje />} />
      <Route path="/hora_salida" element={<HoraSalida />} />
    </Routes>
  );
}

export default eleccion;
