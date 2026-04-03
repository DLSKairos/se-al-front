import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const items_kit = [
  { desc: 'DETERGENTE EN POLVO',             base: 'detergente_polvo' },
  { desc: 'JABON REY',                        base: 'jabon_rey' },
  { desc: 'ESPATULA FLEXIBLE',               base: 'espatula_flexible' },
  { desc: 'GRASA LITIO',                     base: 'grasa_litio' },
  { desc: 'ACEITE HIDRAULICO',               base: 'aceite_hidraulico' },
  { desc: 'PLASTICO GRUESO',                 base: 'plastico_grueso' },
  { desc: 'TALONARIO DE BOMBEO',             base: 'talonario_bombeo' },
  { desc: 'EXTINTOR',                        base: 'extintor' },
  { desc: 'BOTIQUIN',                        base: 'botiquin' },
  { desc: 'GRASERA',                         base: 'grasera' },
  { desc: 'MANGUERA PARA INYECTOR DE GRASA', base: 'manguera_inyector_grasa' },
  { desc: 'RADIO',                           base: 'radio' },
  { desc: 'AURICULAR',                       base: 'auricular' },
  { desc: 'PIMPINA ACPM',                    base: 'pimpina_acpm' },
  { desc: 'BOLA DE LIMPIEZA',               base: 'bola_limpieza' },
  { desc: 'PERROS',                          base: 'perros' },
  { desc: 'GUAYA',                           base: 'guaya' },
];

/**
 * KitLimpieza — formulario de inventario de kit de lavado y mantenimiento para Bomberman.
 * Registra la cantidad (buena/mala) y observación por ítem, y envía mediante POST a
 * /bomberman/kit_limpieza.
 */
function KitLimpieza() {
  const [generales, setGenerales] = useState({
    cliente: "",
    proyecto: "",
    fecha: "",
    nombre_operador: "",
    bomba_numero: ""
  });
  const [items, setItems] = useState({});
  const [observaciones, setObservaciones] = useState("");
  const [lista_bombas, set_lista_bombas] = useState([]);
  const guardarBtnRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_BASE_URL}/bombas`)
      .then(res => {
        const bombas = Array.isArray(res.data.bombas) ? res.data.bombas : res.data || [];
        set_lista_bombas(bombas);
        try { localStorage.setItem('cached_bombas', JSON.stringify(bombas)); } catch {}
      })
      .catch(() => {
        // Intentar usar caché si la red falla
        try {
          const cached = localStorage.getItem('cached_bombas');
          if (cached) set_lista_bombas(JSON.parse(cached));
        } catch {}
      });
  }, []);

  useEffect(() => {
    const nombre_proyecto = localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "";
    const nombre_operador = localStorage.getItem("nombre_trabajador") || "";
    const fechaHoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

    axios.get(`${API_BASE_URL}/obras`)
      .then(res => {
        let obras = [];
        if (Array.isArray(res.data.obras)) obras = res.data.obras;
        const obra = obras.find(o => o.nombre_obra === nombre_proyecto);
        const constructora = obra ? obra.constructora : "";
        setGenerales({
          cliente: constructora,
          proyecto: nombre_proyecto,
          fecha: fechaHoy,
          nombre_operador,
          bomba_numero: ""
        });
      })
      .catch(() => {
        setGenerales({
          cliente: "",
          proyecto: nombre_proyecto,
          fecha: fechaHoy,
          nombre_operador,
          bomba_numero: ""
        });
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      nombre_cliente: generales.cliente || "Sin registrar",
      nombre_proyecto: generales.proyecto || "Sin registrar",
      fecha_servicio: generales.fecha,
      nombre_operador: generales.nombre_operador,
      empresa_id: 2,
      bomba_numero: generales.bomba_numero || "",
      observaciones: observaciones,
      ...items_kit.reduce((acc, h, idx) => {
        acc[`${h.base}_buena`] = parseInt(items[idx]?.buena) || 0;
        acc[`${h.base}_mala`] = parseInt(items[idx]?.mala) || 0;
        acc[`${h.base}_estado`] = items[idx]?.estado || "";
        return acc;
      }, {})
    };

    try {
      await axios.post(`${API_BASE_URL}/bomberman/kit_limpieza`, payload);
      window.alert("Kit de lavado y mantenimiento guardado correctamente.");
      navigate(-1);
    } catch (err) {
      window.alert("Error al guardar. Revisa la consola para detalles.");
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="card-section">
        <h3 className="card-title">Datos Generales</h3>
        <div>
          <label className="label">Cliente / Constructora</label>
          <input type="text" value={generales.cliente} readOnly />
        </div>
        <div>
          <label className="label">Proyecto</label>
          <input type="text" value={generales.proyecto} readOnly />
        </div>
        <div>
          <label className="label">Fecha</label>
          <input type="date" value={generales.fecha} readOnly />
        </div>
        <div>
          <label className="label">Operador</label>
          <input type="text" value={generales.nombre_operador} readOnly />
        </div>
        <div>
          <label className="label">Bomba Número</label>
          <select
            value={generales.bomba_numero}
            onChange={e => setGenerales(prev => ({ ...prev, bomba_numero: e.target.value }))}
            className="permiso-trabajo-select"
          >
            <option value="">Seleccionar bomba</option>
            {lista_bombas.map((b, idx) => (
              <option key={idx} value={b.numero_bomba}>{b.numero_bomba}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-section">
        <h3 className="card-title">KIT DE LAVADO Y MANTENIMIENTO</h3>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, gap: 8 }}>
          <span style={{ fontWeight: 600, width: 60, textAlign: "center", fontSize: 13 }}>Buena</span>
          <span style={{ fontWeight: 600, width: 60, textAlign: "center", fontSize: 13 }}>Mala</span>
          <span style={{ fontWeight: 600, width: 90, textAlign: "center", fontSize: 13 }}>Estado</span>
        </div>
        {items_kit.map((h, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
            <span style={{ flex: 1, fontSize: 13 }}>{idx + 1}. {h.desc}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={items[idx]?.buena || ""}
              onChange={e => setItems(prev => ({ ...prev, [idx]: { ...prev[idx], buena: e.target.value.replace(/[^0-9]/g, "") } }))}
              style={{ width: 60, textAlign: "center" }}
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={items[idx]?.mala || ""}
              onChange={e => setItems(prev => ({ ...prev, [idx]: { ...prev[idx], mala: e.target.value.replace(/[^0-9]/g, "") } }))}
              style={{ width: 60, textAlign: "center" }}
            />
            <input
              type="text"
              value={items[idx]?.estado || ""}
              onChange={e => setItems(prev => ({ ...prev, [idx]: { ...prev[idx], estado: e.target.value } }))}
              style={{ width: 90 }}
            />
          </div>
        ))}
      </div>

      <div className="card-section">
        <label className="label">OBSERVACIONES</label>
        <textarea
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          style={{ width: "94%", minHeight: 80 }}
        />
      </div>

      <div style={{ textAlign: "right", marginTop: 18 }}>
        <button
          type="submit"
          className="button"
          style={{ background: "#ff9800", color: "#fff" }}
          ref={guardarBtnRef}
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

export default KitLimpieza;
