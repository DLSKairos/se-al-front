import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const DIRECTORES = [];
const AREAS = [];

/** @returns {string} Fecha en formato YYYY-MM-DD en la zona horaria America/Bogota */
function getTodayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

/**
 * PQR — formulario de peticiones, quejas y reclamos para el rol SST.
 * Envía mediante POST a /sst/pqr al guardar. DIRECTORES y AREAS son marcadores de posición
 * pendientes de datos del backend.
 */
function PQR() {
  const [obras, setObras] = useState([]);
  const [form, setForm] = useState({
    nombre_cliente: localStorage.getItem("constructora") || localStorage.getItem("empresa_trabajador") || "",
    nombre_proyecto: localStorage.getItem("obra") || "",
    fecha_servicio: getTodayStr(),
    nombre_operador: localStorage.getItem("nombre_trabajador") || "",
    nombre_director: "",
    area: "",
    pqr: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API_BASE_URL}/obras`)
      .then(res => {
        const activas = (res.data.obras || []).filter(o => o.activa === true);
        setObras(activas);
      })
      .catch(() => setObras([]));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");

    const requeridos = ["nombre_cliente", "nombre_proyecto", "nombre_director", "area", "pqr"];
    const faltantes = requeridos.filter(k => !form[k]?.trim());
    if (faltantes.length) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setEnviando(true);
    try {
      await axios.post(`${API_BASE_URL}/sst/pqr`, form);
      setExito(true);
      setForm(prev => ({ ...prev, nombre_director: "", area: "", pqr: "" }));
    } catch (err) {
      setError(err.response?.data?.error || "Error al enviar. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (exito) {
    return (
      <div className="form-container">
        <div className="card-section" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
          <h2 className="card-title" style={{ color: "#43a047" }}>PQR enviada correctamente</h2>
          <p className="label">Tu solicitud fue registrada exitosamente.</p>
          <button
            className="button"
            style={{ marginTop: 24 }}
            onClick={() => setExito(false)}
          >
            Registrar otra PQR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="card-section">
        <h2 className="card-title">PQR</h2>
        <p className="label" style={{ marginBottom: 20, textAlign: "center" }}>
          Peticiones, Quejas y Reclamos
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Nombre cliente */}
          <div>
            <label className="label">Cliente / Constructora</label>
            <input
              className="input"
              name="nombre_cliente"
              value={form.nombre_cliente}
              onChange={handleChange}
              placeholder="Nombre del cliente"
            />
          </div>

          {/* Proyecto / Obra */}
          <div>
            <label className="label">Proyecto / Obra</label>
            <input
              className="input"
              list="lista-obras-pqr"
              name="nombre_proyecto"
              value={form.nombre_proyecto}
              onChange={handleChange}
              placeholder="Selecciona o escribe la obra"
            />
            <datalist id="lista-obras-pqr">
              {obras.map(o => (
                <option key={o.id} value={o.nombre_obra} />
              ))}
            </datalist>
          </div>

          {/* Fecha servicio */}
          <div>
            <label className="label">Fecha</label>
            <input
              className="input"
              type="date"
              name="fecha_servicio"
              value={form.fecha_servicio}
              onChange={handleChange}
            />
          </div>

          {/* Nombre operador */}
          <div>
            <label className="label">Operador</label>
            <input
              className="input"
              name="nombre_operador"
              value={form.nombre_operador}
              onChange={handleChange}
              placeholder="Nombre del operador"
              readOnly
            />
          </div>

          {/* Director */}
          <div>
            <label className="label">Director</label>
            <select
              className="input"
              name="nombre_director"
              value={form.nombre_director}
              onChange={handleChange}
            >
              <option value="">-- Selecciona un director --</option>
              {DIRECTORES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Área */}
          <div>
            <label className="label">Área</label>
            <select
              className="input"
              name="area"
              value={form.area}
              onChange={handleChange}
            >
              <option value="">-- Selecciona un área --</option>
              {AREAS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Texto PQR */}
          <div>
            <label className="label">Descripción de la PQR</label>
            <textarea
              className="input"
              name="pqr"
              value={form.pqr}
              onChange={handleChange}
              placeholder="Describe tu petición, queja o reclamo..."
              rows={5}
              style={{ resize: "vertical", minHeight: 100 }}
            />
          </div>

          {error && (
            <div style={{ color: "#c00", fontWeight: 500, textAlign: "center" }}>{error}</div>
          )}

          <button
            type="submit"
            className="button"
            disabled={enviando}
            style={{ marginTop: 8, opacity: enviando ? 0.7 : 1 }}
          >
            {enviando ? "Enviando..." : "Enviar PQR"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default PQR;
