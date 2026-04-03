import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PlanillaDeBombeo from "./planillabombeo";
import Checklist from "./checklist";
import InventariosObra from "./inventariosobra";
import Administrador from "../administrador_gruaman/administrador";
import AdministradorBomberman from "../administrador_bomberman/administrador_bomberman";
import "../../App.css";
import PermisoTrabajo from "../compartido/permiso_trabajo";
import ChequeoAlturas from "../compartido/chequeo_alturas";
import inspeccionEpccBomberman from "./inspeccion_epcc_bomberman";
import HerramientasMantenimiento from "./herramientas_mantenimiento";
import KitLimpieza from "./kit_limpieza";
import HoraIngreso from "../compartido/horada_ingreso";
import HoraSalida from "../compartido/hora_salida";
import { markWorldComplete } from '../../db/gameProgress';


/**
 * @param {string} usuario
 * @returns {Object} Map of worldId → boolean
 */
function getUsadosFromStorage(usuario) {
  try {
    const data = localStorage.getItem(`aic_usados_${usuario}`);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    hora_ingreso: false,
    permiso_trabajo: false,
    planillabombeo: false,
    checklist: false,
    herramientas_mantenimiento: false,
    kit_limpieza: false,
    inventariosobra: false,
    chequeo_alturas: false,
    inspeccion_epcc_bomberman: false,
    hora_salida: false
  };
}

function setUsadosToStorage(usados, usuario) {
  localStorage.setItem(`aic_usados_${usuario}`, JSON.stringify(usados));
}

function limpiarUsados(usuario) {
  localStorage.removeItem(`aic_usados_${usuario}`);
  try { localStorage.removeItem(`aic_usados_date_${usuario}`); } catch {}
}

/** @returns {string} YYYY-MM-DD date string in America/Bogota timezone */
function getTodayDateStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

/** @returns {string} Current month key as 'YYYY-MM' in America/Bogota timezone */
function getCurrentMonthKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" }).slice(0, 7);
}
function isFirstDayOfMonth() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" }).slice(8, 10) === "01";
}

/**
 * BienvenidaAIC — pantalla de selección de misiones para Bomberman.
 * Rastrea qué misiones han sido usadas hoy y se reinicia a medianoche.
 * Inventarios de obra se reinicia mensualmente. Redirige a los componentes de formulario individuales.
 */
function BienvenidaAIC() {
  const navigate = useNavigate();

  useEffect(() => {
    const worldId = localStorage.getItem('game_mode');
    if (worldId) {
      localStorage.removeItem('game_mode');
      markWorldComplete(worldId);
      navigate('/game/world-map', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empresa = localStorage.getItem("empresa") || "";
  const nombre = localStorage.getItem("nombre_trabajador") || "";
  let empresaNombre = "";
  if (empresa === "GyE") empresaNombre = "GruaMan";
  else if (empresa === "AIC") empresaNombre = "BomberMan";
  else empresaNombre = "";

  const usuario = nombre || "anonimo";
  const [usados, setUsados] = useState(() => getUsadosFromStorage(usuario));
  const [usuarioActual, setUsuarioActual] = useState(usuario);

  useEffect(() => {
    const nuevoUsuario = localStorage.getItem("nombre_trabajador") || "anonimo";
    const nuevaEmpresa = localStorage.getItem("empresa") || "";
    const key = `${nuevoUsuario}__${nuevaEmpresa}`;
    if (key !== usuarioActual) {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(key));
      setUsuarioActual(key);
    }
    // eslint-disable-next-line
  }, [localStorage.getItem("nombre_trabajador"), localStorage.getItem("empresa")]);

  useEffect(() => {
    setUsadosToStorage(usados, usuarioActual);
    try { localStorage.setItem(`aic_usados_date_${usuarioActual}`, getTodayDateStr()); } catch {}
  }, [usados, usuarioActual]);

  useEffect(() => {
    const dateKey = `aic_usados_date_${usuarioActual}`;
    const today = getTodayDateStr();
    const storedDate = localStorage.getItem(dateKey);
    if (storedDate !== today) {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(usuarioActual));
      try { localStorage.setItem(dateKey, today); } catch {}
    }

    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(usuarioActual));
      try { localStorage.setItem(dateKey, getTodayDateStr()); } catch {}
    }, msUntilMidnight);

    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [usuarioActual]);

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

  useEffect(() => {
    const monthKey = getCurrentMonthKey();
    const saved = localStorage.getItem("bomberman_inventariosobra_respuestas");
    let shouldClear = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isFirstDayOfMonth() || parsed.monthKey !== monthKey) {
          shouldClear = true;
        }
      } catch {
        shouldClear = true;
      }
    }
    if (shouldClear) {
      setUsados(prev => {
        if (!prev.inventariosobra) return prev;
        const nuevos = { ...prev, inventariosobra: false };
        setUsadosToStorage(nuevos, usuarioActual);
        return nuevos;
      });
    }
    // eslint-disable-next-line
  }, []);
  // progress bar (ajustar para contar inventariosobra solo si está vigente este mes)
  const monthKey = getCurrentMonthKey();
  const savedInv = localStorage.getItem("bomberman_inventariosobra_respuestas");
  let inventarioObraVigente = false;
  if (savedInv) {
    try {
      const parsed = JSON.parse(savedInv);
      if (parsed.monthKey === monthKey) {
        inventarioObraVigente = true;
      }
    } catch {}
  }
  // Ajustar usados para barra y color
  const usadosParaBarra = { ...usados, inventariosobra: inventarioObraVigente ? true : false };
  const total = 10; // ahora hay 10 formularios
  const completados = Object.values({
    ...usadosParaBarra,
    hora_ingreso: usados.hora_ingreso,
    hora_salida: usados.hora_salida
  }).filter(Boolean).length;
  const porcentaje = Math.round((completados / total) * 100);

  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">
          Bienvenido Super Heroe{empresaNombre ? ` ${empresaNombre}` : ""}{nombre ? ` ${nombre}` : ""}
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
        <p className="label" style={{ marginBottom: 32 }}>
          Selecciona el formulario que deseas usar:
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {/* Hora de ingreso - primero */}
          <button
            className={getButtonClass(usados.hora_ingreso)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/hora_ingreso", "hora_ingreso")}
          >
            Hora de Ingreso
          </button>
          <p className="label" style={{ marginBottom: 20, fontSize: 20 }}>
            Diario
          </p>
          <button
            className={getButtonClass(usados.permiso_trabajo)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/permiso_trabajo", "permiso_trabajo")}
          >
            Permiso de Trabajo 
          </button>
          <button
            className={getButtonClass(usados.planillabombeo)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/planillabombeo", "planillabombeo")}
          >
            Planilla de Bombeo 
          </button>
          <button
            className={getButtonClass(usados.checklist)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/checklist", "checklist")}
          >
            Checklist
          </button>
          <button
            className={getButtonClass(usados.herramientas_mantenimiento)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/herramientas_mantenimiento", "herramientas_mantenimiento")}
          >
            Herramientas de Mantenimiento
          </button>
          <button
            className={getButtonClass(usados.kit_limpieza)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/kit_limpieza", "kit_limpieza")}
          >
            Kit de Lavado y Mantenimiento
          </button>
          <button
            className={getButtonClass(usados.chequeo_alturas)}
            style={{
              maxWidth: 320,
              background: "linear-gradient(145deg, var(--naranja), var(--naranja-claro))",
              color: "#fff",
              fontWeight: 600
            }}
            onClick={() => handleNavigate("/chequeo_alturas", "chequeo_alturas")}
          >
            Chequeo Alturas 
          </button>
          <button
            className={getButtonClass(usados.inspeccion_epcc_bomberman)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/inspeccion_epcc_bomberman", "inspeccion_epcc_bomberman")}
          >
            Inspección EPCC 
          </button>
          <p className="label" style={{ marginBottom: 20, fontSize: 20 }}>
            Mensual
          </p>
          <button
            className={inventarioObraVigente ? "button button-green" : "button"}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/inventariosobra", "inventariosobra")}
          >
            Inventario de Obra 
          </button>
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

function EleccionAIC() {
  return (
    <Routes>
      <Route path="/" element={<BienvenidaAIC />} />
      <Route path="/hora_ingreso" element={<HoraIngreso />} />
      <Route path="/planillabombeo" element={<PlanillaDeBombeo />} />
      <Route path="/checklist" element={<Checklist />} />
      <Route path="/inventariosobra" element={<InventariosObra />} />
      <Route path="/herramientas_mantenimiento" element={<HerramientasMantenimiento />} />
      <Route path="/kit_limpieza" element={<KitLimpieza />} />
      <Route path="/administrador" element={<Administrador />} />
      <Route path="/administrador_bomberman" element={<AdministradorBomberman />} />
      <Route path="/permiso_trabajo" element={<PermisoTrabajo />} />
      <Route path="/chequeo_alturas" element={<ChequeoAlturas />} />
      <Route path="/inspeccion_epcc_bomberman" element={<inspeccionEpccBomberman />} />
      <Route path="/hora_salida" element={<HoraSalida />} />
    </Routes>
  );
}

export default EleccionAIC;
