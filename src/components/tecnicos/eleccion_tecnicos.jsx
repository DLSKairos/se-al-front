import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "../../App.css";
import HoradaIngreso from "../compartido/horada_ingreso";
import HoraSalida from "../compartido/hora_salida";
import PermisoTrabajo from "../compartido/permiso_trabajo";

function getUsadosFromStorage(usuario) {
  try {
    const data = localStorage.getItem(`tecnicos_usados_${usuario}`);
    if (data) return JSON.parse(data);
  } catch {}
  return { hora_ingreso: false, hora_salida: false, permiso_trabajo: false };
}

function setUsadosToStorage(usados, usuario) {
  localStorage.setItem(`tecnicos_usados_${usuario}`, JSON.stringify(usados));
}

function limpiarUsados(usuario) {
  localStorage.removeItem(`tecnicos_usados_${usuario}`);
  localStorage.removeItem(`tecnicos_usados_fecha_${usuario}`);
}

function getTodayDateStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

function BienvenidaTecnicos() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem("nombre_trabajador") || "";
  const usuario = nombre || "anonimo";
  const [usados, setUsados] = useState(() => getUsadosFromStorage(usuario));
  const [usuarioActual] = useState(usuario);

  useEffect(() => {
    const fechaHoy = getTodayDateStr();
    const fechaGuardada = localStorage.getItem(`tecnicos_usados_fecha_${usuarioActual}`);
    if (fechaGuardada !== fechaHoy) {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(usuarioActual));
      localStorage.setItem(`tecnicos_usados_fecha_${usuarioActual}`, fechaHoy);
    }
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(usuarioActual));
      localStorage.setItem(`tecnicos_usados_fecha_${usuarioActual}`, getTodayDateStr());
    }, msUntilMidnight);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [usuarioActual]);

  useEffect(() => {
    setUsadosToStorage(usados, usuarioActual);
    localStorage.setItem(`tecnicos_usados_fecha_${usuarioActual}`, getTodayDateStr());
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
            onClick={() => handleNavigate("/eleccion_tecnicos/hora_ingreso", "hora_ingreso")}
          >
            Hora de Ingreso
          </button>
          <button
            className={getButtonClass(usados.hora_salida)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/eleccion_tecnicos/hora_salida", "hora_salida")}
          >
            Hora de Salida
          </button>
          <button
            className={getButtonClass(usados.permiso_trabajo)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/eleccion_tecnicos/permiso_trabajo", "permiso_trabajo")}
          >
            Permiso de Trabajo
          </button>
        </div>
      </div>
    </div>
  );
}

function EleccionTecnicos() {
  return (
    <Routes>
      <Route path="/" element={<BienvenidaTecnicos />} />
      <Route path="/hora_ingreso" element={<HoradaIngreso />} />
      <Route path="/hora_salida" element={<HoraSalida />} />
      <Route path="/permiso_trabajo" element={<PermisoTrabajo />} />
    </Routes>
  );
}

export default EleccionTecnicos;
