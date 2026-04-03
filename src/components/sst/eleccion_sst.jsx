import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "../../App.css";
import PQR from "./pqr";
import Hallazgos from "./hallazgos";

/**
 * @param {string} usuario
 * @returns {Object} Map of worldId → boolean
 */
function getUsadosFromStorage(usuario) {
  try {
    const data = localStorage.getItem(`sst_usados_${usuario}`);
    if (data) return JSON.parse(data);
  } catch {}
  return { pqr: false, hallazgos: false, hora_ingreso: false, hora_salida: false };
}

function setUsadosToStorage(usados, usuario) {
  localStorage.setItem(`sst_usados_${usuario}`, JSON.stringify(usados));
}

function limpiarUsados(usuario) {
  localStorage.removeItem(`sst_usados_${usuario}`);
  localStorage.removeItem(`sst_usados_fecha_${usuario}`);
}

/** @returns {string} YYYY-MM-DD date in America/Bogota timezone */
function getTodayDateStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

/**
 * BienvenidaSST — selector de misiones para el rol SST (seguridad y salud en el trabajo).
 * Rastrea el uso diario por usuario y se reinicia a medianoche.
 */
function BienvenidaSST() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem("nombre_trabajador") || "";
  const usuario = nombre || "anonimo";
  const [usados, setUsados] = useState(() => getUsadosFromStorage(usuario));
  const [usuarioActual, setUsuarioActual] = useState(usuario);

  useEffect(() => {
    const fechaHoy = getTodayDateStr();
    const fechaGuardada = localStorage.getItem(`sst_usados_fecha_${usuarioActual}`);
    if (fechaGuardada !== fechaHoy) {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(usuarioActual));
      localStorage.setItem(`sst_usados_fecha_${usuarioActual}`, fechaHoy);
    }
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(usuarioActual));
      localStorage.setItem(`sst_usados_fecha_${usuarioActual}`, getTodayDateStr());
    }, msUntilMidnight);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [usuarioActual]);

  useEffect(() => {
    setUsadosToStorage(usados, usuarioActual);
    localStorage.setItem(`sst_usados_fecha_${usuarioActual}`, getTodayDateStr());
  }, [usados, usuarioActual]);

  const handleNavigate = (ruta, key) => {
    setUsados(prev => {
      const nuevos = { ...prev, [key]: true };
      setUsadosToStorage(nuevos, usuarioActual);
      return nuevos;
    });
    navigate(ruta);
  };

  const getButtonClass = (usado) => usado ? "button button-green" : "button";

  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">
          Bienvenido{nombre ? ` ${nombre}` : ""}
        </h3>
        <p className="label" style={{ marginBottom: 20 }}>
          Selecciona el formulario que deseas usar:
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <button
            className={getButtonClass(usados.hora_ingreso)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/hora_ingreso", "hora_ingreso")}
          >
            Hora de Ingreso
          </button>
          <button
            className={getButtonClass(usados.hora_salida)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/hora_salida", "hora_salida")}
          >
            Hora de Salida
          </button>
          <button
            className={getButtonClass(usados.pqr)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/pqr", "pqr")}
          >
            PQR
          </button>
          <button
            className={getButtonClass(usados.hallazgos)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/hallazgos", "hallazgos")}
          >
            Hallazgos
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * EleccionSST — contenedor de rutas para el rol SST (BienvenidaSST + sub-rutas).
 */
function EleccionSST() {
  return (
    <Routes>
      <Route path="/" element={<BienvenidaSST />} />
      <Route path="/pqr" element={<PQR />} />
      <Route path="/hallazgos" element={<Hallazgos />} />
    </Routes>
  );
}

export default EleccionSST;
