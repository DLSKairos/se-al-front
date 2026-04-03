import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * PlanillaBombeo — hoja de control de bombeo para el rol Bomberman.
 * Recopila datos de operación de la bomba por vaciada de concreto (volumétricos, presiones, tiempos).
 * Envía mediante POST a /bomberman/planilla_bombeo al guardar.
 *
 * @param {Object}   props
 * @param {Function} [props.onFinish]  Se llama tras un envío exitoso.
 */
function PlanillaBombeo(props) {
  const [datos, setDatos] = useState({
    nombre_cliente: "",
    nombre_proyecto: "",
    fecha_servicio: "",
    bomba_numero: "",
    hora_llegada_obra: "",
    hora_salida_obra: "",
    remision: "",
    hora_llegada: "",
    hora_inicial: "",
    hora_final: "",
    metros: "",
    observaciones: "",
    galones_inicio_acpm: "",
    galones_final_acpm: "",
    galones_pinpina: "",
    horometro_inicial: "",
    horometro_final: "",
    nombre_operador: "",
    nombre_auxiliar: "",
    total_metros_cubicos_bombeados: "",
    nombre_cliente_aceptacion: "",
    cc_cliente_aceptacion: ""
  });

  const [lista_nombres, set_lista_nombres] = useState([]);
  const [busqueda_auxiliar, set_busqueda_auxiliar] = useState("");
  const [remisiones, set_remisiones] = useState([]);
  const [modal_abierto, set_modal_abierto] = useState(false);
  const [remision_actual, set_remision_actual] = useState({
    remision: "",
    hora_llegada: "",
    hora_inicial: "",
    hora_final: "",
    metros: "",
    observaciones: "",
    manguera: "3"
  });
  const [lista_bombas, set_lista_bombas] = useState([]);
  const [errores, setErrores] = useState({});
  const guardarBtnRef = useRef(null);
  const nombre_operador_local = localStorage.getItem("nombre_trabajador") || "";
  const navigate = useNavigate();

  useEffect(() => {
    const nombre_obra = localStorage.getItem("obra") || "";
    const fecha_hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
    const hora_llegada_obra = localStorage.getItem("hora_llegada_obra") || "";
    const hora_salida_obra = localStorage.getItem("hora_salida_obra") || "";
    setDatos(prev => ({
      ...prev,
      nombre_proyecto: nombre_obra,
      fecha_servicio: fecha_hoy,
      nombre_operador: nombre_operador_local,
      hora_llegada_obra,
      hora_salida_obra
    }));
  }, [nombre_operador_local]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/nombres_trabajadores`)
      .then(res => {
        let nombres = [];
        if (Array.isArray(res.data)) {
          nombres = res.data;
        } else if (Array.isArray(res.data.nombres)) {
          nombres = res.data.nombres;
        }
        nombres.sort((a, b) => a.localeCompare(b));
        set_lista_nombres(nombres);
      })
      .catch(() => set_lista_nombres([]));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/obras`)
      .then(res => {
        let obras = [];
        if (Array.isArray(res.data.obras)) {
          obras = res.data.obras;
        }
        const nombre_obra = localStorage.getItem("obra") || "";
        const obra_seleccionada = obras.find(o => o.nombre_obra === nombre_obra);
        const constructora = obra_seleccionada ? obra_seleccionada.constructora : "";
        const fecha_hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
        setDatos(prev => ({
          ...prev,
          nombre_proyecto: nombre_obra,
          fecha_servicio: fecha_hoy,
          nombre_operador: nombre_operador_local,
          nombre_cliente: constructora
        }));
      })
      .catch(() => {
        setDatos(prev => ({
          ...prev,
          nombre_cliente: ""
        }));
      });
  }, [nombre_operador_local]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/bombas`)
      .then(res => {
        let bombas = [];
        if (Array.isArray(res.data.bombas)) {
          bombas = res.data.bombas;
        } else if (Array.isArray(res.data)) {
          bombas = res.data;
        }
        set_lista_bombas(bombas);
      })
      .catch(() => set_lista_bombas([]));
  }, []);

  useEffect(() => {
    localStorage.setItem("hora_llegada_obra", datos.hora_llegada_obra || "");
  }, [datos.hora_llegada_obra]);
  useEffect(() => {
    localStorage.setItem("hora_salida_obra", datos.hora_salida_obra || "");
  }, [datos.hora_salida_obra]);

  const registrar_hora_llegada_obra = () => {
    const hora = get_hora_actual();
    localStorage.setItem("hora_llegada_obra", hora);
    setDatos(prev => ({ ...prev, hora_llegada_obra: hora }));
  };
  const registrar_hora_salida_obra = () => {
    const hora = get_hora_actual();
    localStorage.setItem("hora_salida_obra", hora);
    setDatos(prev => ({ ...prev, hora_salida_obra: hora }));
  };

  const scrollToItem = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus?.();
    }
  };

  const scrollToGuardar = () => {
    if (guardarBtnRef.current) {
      guardarBtnRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      guardarBtnRef.current.focus?.();
    }
  };

  const handle_change = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
    setErrores((prev) => ({ ...prev, [e.target.name]: false }));
  };

  const handle_remision_change = (e) => {
    set_remision_actual({ ...remision_actual, [e.target.name]: e.target.value });
  };

  const abrir_modal_remision = () => {
    const numero_remision = (remisiones.length + 1).toString();
    set_remision_actual({
      remision: numero_remision,
      hora_llegada: "",
      hora_inicial: "",
      hora_final: "",
      metros: "",
      observaciones: "",
      manguera: "3"
    });
    set_modal_abierto(true);
  };

  const handle_galones_change = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 0 && (Number(val) > 30)) val = "30";
    setDatos({ ...datos, [e.target.name]: val });
  };

  const handle_metros_change = (e) => {
    let val = e.target.value.replace(/[^0-9.]/g, "");
    if (val && Number(val) > 12) val = "12";
    set_remision_actual({ ...remision_actual, metros: val });
  };

  const handle_horometro_change = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) val = val.slice(0, 4);
    setDatos({ ...datos, [e.target.name]: val });
  };

  const guardar_remision = () => {
    if (!remision_actual.metros || Number(remision_actual.metros) > 12) {
      alert("El valor de metros cúbicos debe ser menor o igual a 12 y puede tener decimales.");
      return;
    }
    const nuevas_remisiones = [...remisiones, remision_actual];
    const total_metros = nuevas_remisiones.reduce(
      (acc, r) => acc + (parseFloat(r.metros) || 0),
      0
    );
    set_remisiones(nuevas_remisiones);
    setDatos(prev => ({
      ...prev,
      total_metros_cubicos_bombeados: total_metros
    }));
    set_modal_abierto(false);
  };

  /**
   * Envía el formulario de planilla de bombeo al backend.
   */
  const handle_guardar = async (e) => {
    e.preventDefault();

    const camposObligatorios = [
      "nombre_cliente",
      "nombre_proyecto",
      "fecha_servicio",
      "bomba_numero",
      "galones_inicio_acpm",
      "galones_final_acpm",
      "galones_pinpina",
      "horometro_inicial",
      "horometro_final",
      "nombre_operador",
      "nombre_auxiliar",
      "total_metros_cubicos_bombeados",
      "nombre_cliente_aceptacion",
      "cc_cliente_aceptacion"
    ];

    const erroresTemp = {};
    let primerError = null;

    camposObligatorios.forEach((campo) => {
      if (!datos[campo] || datos[campo].toString().trim() === "") {
        erroresTemp[campo] = true;
        if (!primerError) primerError = campo;
      }
    });

    setErrores(erroresTemp);

    if (primerError) {
      scrollToItem(`campo_${primerError}`);
      return;
    }

    if (!Array.isArray(remisiones) || remisiones.length === 0) {
      alert("Debes agregar al menos una remisión antes de guardar.");
      return;
    }
    const remisiones_validas = remisiones.every(r =>
      r.remision &&
      r.hora_llegada &&
      r.hora_inicial &&
      r.hora_final &&
      r.metros &&
      !isNaN(Number(r.metros)) &&
      Number(r.metros) > 0 &&
      /^\d{2}:\d{2}$/.test(r.hora_llegada) &&
      /^\d{2}:\d{2}$/.test(r.hora_inicial) &&
      /^\d{2}:\d{2}$/.test(r.hora_final)
    );
    if (!remisiones_validas) {
      alert("Todas las remisiones deben tener los campos completos y las horas en formato HH:MM.");
      return;
    }

    const payload = {
      nombre_cliente: datos.nombre_cliente,
      nombre_proyecto: datos.nombre_proyecto,
      fecha_servicio: datos.fecha_servicio,
      bomba_numero: datos.bomba_numero,
      hora_llegada_obra: "",
      hora_salida_obra: "",
      galones_inicio_acpm: datos.galones_inicio_acpm,
      galones_final_acpm: datos.galones_final_acpm,
      galones_pinpina: datos.galones_pinpina,
      horometro_inicial: datos.horometro_inicial,
      horometro_final: datos.horometro_final,
      nombre_operador: datos.nombre_operador,
      nombre_auxiliar: datos.nombre_auxiliar,
      total_metros_cubicos_bombeados: datos.total_metros_cubicos_bombeados,
      nombre_cliente_aceptacion: datos.nombre_cliente_aceptacion,
      cc_cliente_aceptacion: datos.cc_cliente_aceptacion,
      remisiones: Array.isArray(remisiones) ? remisiones.map(r => ({
        remision: r.remision,
        hora_llegada: r.hora_llegada,
        hora_inicial: r.hora_inicial,
        hora_final: r.hora_final,
        metros: Number(r.metros),
        observaciones: r.observaciones,
        manguera: r.manguera
      })) : []
    };

    try {
      const res = await fetch(`${API_BASE_URL}/bomberman/planillabombeo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const res_text = await res.text();
      if (!res.ok) {
        let msg = res_text || "Error al guardar";
        try {
          const json = JSON.parse(res_text);
          if (json.message) msg = json.message;
          else if (json.error) msg = json.error;
        } catch (_) {}
        throw new Error(`(${res.status}) ${msg}`);
      }
      alert("Guardado exitosamente");
      localStorage.removeItem("hora_llegada_obra");
      localStorage.removeItem("hora_salida_obra");
      if (props.onFinish) props.onFinish();
      navigate(-1);
    } catch (err) {
      alert("Error al guardar: " + err.message);
    }
  };

  const get_hora_actual = () => {
    const now = new Date();
    return now.toTimeString().slice(0,5);
  };

  const lista_filtrada = lista_nombres.filter(nombre =>
    nombre.toLowerCase().includes(busqueda_auxiliar.toLowerCase())
  );

  const remision_completa = (
    remision_actual.remision.trim() !== "" &&
    remision_actual.hora_llegada.trim() !== "" &&
    remision_actual.hora_inicial.trim() !== "" &&
    remision_actual.hora_final.trim() !== "" &&
    remision_actual.metros.trim() !== "" &&
    !isNaN(Number(remision_actual.metros)) &&
    Number(remision_actual.metros) > 0
  );

  const opciones_manguera = ["3", "4", "5"];

  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">Datos Generales</h3>
        <label className="label">Cliente</label>
        <input
          id="campo_nombre_cliente"
          name="nombre_cliente"
          value={datos.nombre_cliente}
          onChange={handle_change}
          className={`input${errores.nombre_cliente ? " campo-error" : ""}`}
          style={errores.nombre_cliente ? { borderColor: "red", background: "#ffeaea" } : {}}
        />
        {errores.nombre_cliente && (
          <span style={{ color: "red", fontSize: 13 }}>
            Este campo es obligatorio.
            <span
              style={{
                marginLeft: 8,
                cursor: "pointer",
                fontSize: 18,
                verticalAlign: "middle"
              }}
              onClick={scrollToGuardar}
              title="Ir al botón Guardar"
            >
              &#8594;
            </span>
          </span>
        )}
        <label className="label">Proyecto</label>
        <input
          id="campo_nombre_proyecto"
          name="nombre_proyecto"
          value={datos.nombre_proyecto}
          onChange={handle_change}
          className={`input${errores.nombre_proyecto ? " campo-error" : ""}`}
          readOnly
          style={errores.nombre_proyecto ? { borderColor: "red", background: "#ffeaea" } : {}}
        />
        {errores.nombre_proyecto && (
          <span style={{ color: "red", fontSize: 13 }}>
            Este campo es obligatorio.
            <span
              style={{
                marginLeft: 8,
                cursor: "pointer",
                fontSize: 18,
                verticalAlign: "middle"
              }}
              onClick={scrollToGuardar}
              title="Ir al botón Guardar"
            >
              &#8594;
            </span>
          </span>
        )}
        <label className="label">Fecha Servicio</label>
        <input
          id="campo_fecha_servicio"
          type="date"
          name="fecha_servicio"
          value={datos.fecha_servicio}
          onChange={handle_change}
          className={`input${errores.fecha_servicio ? " campo-error" : ""}`}
          readOnly
          style={errores.fecha_servicio ? { borderColor: "red", background: "#ffeaea" } : {}}
        />
        {errores.fecha_servicio && (
          <span style={{ color: "red", fontSize: 13 }}>
            Este campo es obligatorio.
            <span
              style={{
                marginLeft: 8,
                cursor: "pointer",
                fontSize: 18,
                verticalAlign: "middle"
              }}
              onClick={scrollToGuardar}
              title="Ir al botón Guardar"
            >
              &#8594;
            </span>
          </span>
        )}
        <label className="label">Bomba #</label>
        <select
          id="campo_bomba_numero"
          name="bomba_numero"
          value={datos.bomba_numero}
          onChange={handle_change}
          className={`input${errores.bomba_numero ? " campo-error" : ""}`}
          style={errores.bomba_numero ? { borderColor: "red", background: "#ffeaea" } : {}}
        >
          <option value="">Selecciona bomba</option>
          {lista_bombas.map((b, idx) => (
            <option key={idx} value={b.numero_bomba}>{b.numero_bomba}</option>
          ))}
        </select>
        {errores.bomba_numero && (
          <span style={{ color: "red", fontSize: 13 }}>
            Este campo es obligatorio.
            <span
              style={{
                marginLeft: 8,
                cursor: "pointer",
                fontSize: 18,
                verticalAlign: "middle"
              }}
              onClick={scrollToGuardar}
              title="Ir al botón Guardar"
            >
              &#8594;
            </span>
          </span>
        )}
      </div>

      <div className="card-section">
        <h3 className="card-title">Remisiones</h3>
        <div>
          {remisiones.length === 0 && (
            <div style={{ color: "#888", marginBottom: "8px" }}>
              No has guardado ninguna remisión aún.
            </div>
          )}
          {remisiones.map((r, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "12px",
                padding: "10px",
                background: "#f5faff",
                borderRadius: "8px",
                border: "1px solid #e3eafc"
              }}
            >
              <div style={{ fontWeight: "bold", color: "#1976d2", marginBottom: 4 }}>
                Remisión {idx + 1}
              </div>
              <div><strong>N° Remisión:</strong> {r.remision}</div>
              <div><strong>Hora Llegada:</strong> {r.hora_llegada}</div>
              <div><strong>Hora Inicial:</strong> {r.hora_inicial}</div>
              <div><strong>Hora Final:</strong> {r.hora_final}</div>
              <div><strong>M³:</strong> {r.metros}</div>
              <div><strong>Observaciones:</strong> {r.observaciones}</div>
            </div>
          ))}
          <button type="button" className="button" onClick={abrir_modal_remision}>
            Agregar remisión
          </button>
        </div>
      </div>

      <div className="card-section">
        <h3 className="card-title">Consumo y Horómetros</h3>
        <label className="label">Galones de Inicio ACPM</label>
        <input name="galones_inicio_acpm" value={datos.galones_inicio_acpm} onChange={handle_galones_change} className="input" inputMode="numeric" maxLength={2} />
        <label className="label">Galones de Final ACPM</label>
        <input name="galones_final_acpm" value={datos.galones_final_acpm} onChange={handle_galones_change} className="input" inputMode="numeric" maxLength={2} />
        <label className="label">Galones Pinpina</label>
        <input name="galones_pinpina" value={datos.galones_pinpina} onChange={handle_galones_change} className="input" inputMode="numeric" maxLength={2} />
        <label className="label">Horómetros Inicial</label>
        <input name="horometro_inicial" value={datos.horometro_inicial} onChange={handle_horometro_change} className="input" inputMode="numeric" maxLength={4} />
        <label className="label">Horómetros Final</label>
        <input name="horometro_final" value={datos.horometro_final} onChange={handle_horometro_change} className="input" inputMode="numeric" maxLength={4} />
      </div>

      <div className="card-section">
        <h3 className="card-title">Operador y Auxiliar</h3>
        <label className="label">Nombre Operador</label>
        <input name="nombre_operador" value={datos.nombre_operador} readOnly className="input" />
        <label className="label">Nombre Auxiliar</label>
        <input
          name="nombre_auxiliar"
          list="lista_nombres_auxiliares"
          placeholder="Buscar o selecciona auxiliar"
          value={busqueda_auxiliar || datos.nombre_auxiliar}
          onChange={e => {
            set_busqueda_auxiliar(e.target.value);
            setDatos({ ...datos, nombre_auxiliar: e.target.value });
          }}
          className="input"
          autoComplete="off"
        />
        <datalist id="lista_nombres_auxiliares">
          {lista_nombres.map((nombre, idx) => (
            <option key={idx} value={nombre} />
          ))}
        </datalist>
      </div>

      <div className="card-section">
        <h3 className="card-title">Totales y aceptación cliente</h3>
        <label className="label">Total M³ Bombeados</label>
        <input name="total_metros_cubicos_bombeados" value={datos.total_metros_cubicos_bombeados} onChange={handle_change} className="input" />
        <label className="label">Aceptación Cliente - Nombre y Apellido</label>
        <input name="nombre_cliente_aceptacion" value={datos.nombre_cliente_aceptacion} onChange={handle_change} className="input" />
        <label className="label">C.C.</label>
        <input name="cc_cliente_aceptacion" value={datos.cc_cliente_aceptacion} onChange={handle_change} className="input" />
      </div>

      <button
        type="button"
        className="button"
        onClick={handle_guardar}
        ref={guardarBtnRef}
      >
        Guardar
      </button>

      {modal_abierto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.35)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              padding: 28,
              minWidth: 320,
              maxWidth: 420,
              width: "90%"
            }}
            className="modal-remision"
          >
            <h3 style={{ color: "#1976d2", textAlign: "center" }}>Agregar Remisión</h3>
            <label className="label">N° Remisión</label>
            <input name="remision" value={remision_actual.remision} readOnly className="input" />
            <label className="label">Hora Llegada</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="time" name="hora_llegada" value={remision_actual.hora_llegada} onChange={handle_remision_change} className="input" />
              <button type="button" className="button" onClick={() => set_remision_actual({ ...remision_actual, hora_llegada: get_hora_actual() })}>Registrar hora</button>
            </div>
            <label className="label">Hora Inicial</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="time" name="hora_inicial" value={remision_actual.hora_inicial} onChange={handle_remision_change} className="input" />
              <button type="button" className="button" onClick={() => set_remision_actual({ ...remision_actual, hora_inicial: get_hora_actual() })}>Registrar hora</button>
            </div>
            <label className="label">Hora Final</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="time" name="hora_final" value={remision_actual.hora_final} onChange={handle_remision_change} className="input" />
              <button type="button" className="button" onClick={() => set_remision_actual({ ...remision_actual, hora_final: get_hora_actual() })}>Registrar hora</button>
            </div>
            <label className="label">Manguera</label>
            <select name="manguera" value={remision_actual.manguera} onChange={handle_remision_change} className="input">
              {opciones_manguera.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>
            <label className="label">M³</label>
            <input name="metros" value={remision_actual.metros} onChange={handle_metros_change} className="input" inputMode="decimal" />
            <label className="label">Observaciones</label>
            <input name="observaciones" value={remision_actual.observaciones} onChange={handle_remision_change} className="input" />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button type="button" className="button" onClick={guardar_remision} disabled={!remision_completa}>
                Guardar
              </button>
              <button type="button" className="button" style={{ background: "#eee", color: "#1976d2" }} onClick={() => set_modal_abierto(false)}>
                Cancelar
              </button>
            </div>
            {!remision_completa && (
              <div style={{ color: "red", marginTop: 8, textAlign: "center", fontSize: 13 }}>
                Completa todos los campos obligatorios y asegúrate que los metros sean un número mayor a 0.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanillaBombeo;


