import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * HoradaIngreso — formulario legado para el registro de hora de ingreso a la jornada.
 * Resuelve el proyecto y cliente desde /obras y persiste el registro mediante POST a /horas_jornada/ingreso.
 * La hora se captura una sola vez a demanda (toque manual) en lugar de hacerlo al montar.
 */
export default function HoradaIngreso() {
  const navigate = useNavigate();
  const [generales, setGenerales] = useState({
    cliente: "",
    proyecto: "",
    fecha: "",
    operador: "",
    cargo: "",
  });
  const [horaRegistrada, setHoraRegistrada] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nombre_proyecto = localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "";
    const nombre_operador = localStorage.getItem("nombre_trabajador") || "";
    const fechaHoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
    const cargo = localStorage.getItem("cargo_trabajador") || "";

    axios.get(`${API_BASE_URL}/obras`)
      .then(res => {
        let obras = [];
        if (Array.isArray(res.data.obras)) {
          obras = res.data.obras;
        }
        const obra_seleccionada = obras.find(o => o.nombre_obra === nombre_proyecto);
        const constructora = obra_seleccionada ? obra_seleccionada.constructora : "";
        setGenerales({
          cliente: constructora,
          proyecto: nombre_proyecto,
          operador: nombre_operador,
          fecha: fechaHoy,
          cargo: cargo,
        });
      })
      .catch(() => {
        setGenerales({
          cliente: "",
          proyecto: nombre_proyecto,
          operador: nombre_operador,
          fecha: fechaHoy,
          cargo: cargo,
        });
      });
  }, []);

  const handleRegistrarHora = () => {
    setHoraRegistrada(new Date().toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Bogota"
    }));
  };

  const handleGuardar = async () => {
    setError("");
    // cliente can be empty if /obras fails to load — backend accepts it
    if (
      !generales.proyecto ||
      !generales.fecha ||
      !generales.operador ||
      !horaRegistrada
    ) {
      setError("Faltan parámetros obligatorios. Verifica los datos generales y vuelve a intentarlo.");
      return;
    }

    const empresa_id = Number(localStorage.getItem("empresa_id")) || 1;

    const payload = {
      nombre_cliente: generales.cliente,
      nombre_proyecto: generales.proyecto,
      fecha_servicio: generales.fecha,
      nombre_operador: generales.operador,
      cargo: generales.cargo || "",
      empresa_id,
      hora_ingreso: horaRegistrada.slice(0,5),
      observaciones: ""
    };

    try {
      const resp = await fetch(`${API_BASE_URL}/horas_jornada/ingreso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      let data = {};
      try {
        data = await resp.json();
      } catch {
        data = {};
      }
      if (resp.ok) {
        setGuardado(true);
        setTimeout(() => navigate(-1), 500);
      } else {
        setError((data && data.error) || `Error al guardar. Código: ${resp.status}`);
      }
    } catch (e) {
      setError("Error de red al guardar");
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: 420, margin: "0 auto", padding: 24 }}>
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Datos generales</h2>
        <div className="datos-generales">
          <div><b>Cliente:</b> {generales.cliente}</div>
          <div><b>Obra:</b> {generales.proyecto}</div>
          <div><b>Fecha:</b> {generales.fecha}</div>
          <div><b>Trabajador:</b> {generales.operador}</div>
          <div><b>Cargo:</b> {generales.cargo}</div>
        </div>
      </div>
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Registro de hora de ingreso</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 500 }}>Hora registrada:</label>
          <div
            className="input"
            style={{
              marginTop: 6,
              fontSize: 20,
              background: "rgba(255,255,255,0.22)",
              borderRadius: "14px",
              boxShadow: "0 4px 16px 0 rgba(31, 38, 135, 0.18)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.28)",
              textAlign: "center",
              color: "#222",
              fontWeight: 600,
              minHeight: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              userSelect: "none"
            }}
          >
            {horaRegistrada || "--:--:--"}
          </div>
        </div>
        <button
          className="button"
          style={{ marginBottom: 12, width: "100%" }}
          onClick={handleRegistrarHora}
          disabled={!!horaRegistrada}
        >
          Registrar hora actual
        </button>
      </div>
      <button
        className="button"
        style={{ width: "100%", background: "#1976d2", color: "#fff" }}
        onClick={handleGuardar}
        disabled={!horaRegistrada}
      >
        Guardar
      </button>
      {guardado && (
        <div style={{ color: "#1976d2", marginTop: 16, textAlign: "center", fontWeight: 600 }}>
          ¡Hora registrada y guardada!
        </div>
      )}
      {error && (
        <div style={{ color: "#c00", marginTop: 16, textAlign: "center", fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  );
}
