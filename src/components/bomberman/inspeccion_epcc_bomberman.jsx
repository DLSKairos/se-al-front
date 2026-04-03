import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const datosGeneralesFields = [
  { name: "nombre", label: "Nombre" },
  { name: "cedula", label: "Cédula" },
  { name: "cargo", label: "Cargo" },
  { name: "fecha", label: "Fecha", type: "date" }
];

const secciones = [
  {
    title: "CONDICIONES DE SALUD, COMPETENCIA LABORAL Y EPP",
    items: [
      "Presenta actualmente algun sintoma o malestar fisico (mareo, dolor de cabeza, vision borrosa, dificultad respiratoria, etc)",
      "Esta tomando algun medicamento que pueda afectar su estado de alerta, equilibrio, o capacidad para realizar tareas criticas?",
      "¿Ha consumido bebidas alcoholicas o sustancias psicoactivas en las ultimas 12 horas?",
      "¿Se encuentra en condiciones fisicas y mentales par realizar tareas que exigen altos niveles de concentracion como trabajo en alturasm espacios confinados, izaje, manejo de quimicos, energias peligrosas o tamar decisiones en las que pueda poner en riesgo la vida propia o de otras personas?",
      "Cuenta con la competencia vigente para la realización de la tarea crítica",
      "Cuenta con protección de la cabeza en buen estado y acorde al tipo de exposición",
      "Cuenta con protección auditiva en buen estado y acorde al tipo de exposición",
      "Cuenta con protección de visual en buen estado y acorde al tipo de exposición",
      "Cuenta con protección respiratoria en buen estado y acorde al tipo de exposición",
      "Cuenta con guantes de protección en buen estado y acordes al tipo de exposición",
      "Cuenta con ropa de trabajo en buen estado y acorde al tipo de exposición",
      "Cuenta con botas de seguridad en buen estado y acordes al tipo de exposición",
      "Cuenta con otros elementos de protección en buen estado y acorde al tipo de exposición (careta, peto, mangas, polainas, entre otros)"
    ]
  },
  {
    title: "EPCC - EQUIPOS DE PROTECCIÓN CONTRA CAÍDAS",
    items: [
      "Etiqueta en buen estado (las etiquetas deben estar presentes y completamente legibles).",
      "Es compatible con el resto del sistema de protección contra caídas (Revise compatibilidad en el diámetro, material y forma)",
      "Absorbedor de impacto en buen estado",
      "Cintas o tiras en buen estado (verifique cortes, deshilachado, desgaste, quemaduras, manchas fuertes, decoloración etc.)",
      "Costuras en buen estado (inspecciones daños en las costuras o puntadas sueltas).",
      "Testigos o indicadores de impacto en buen estado.",
      "Buen estado de partes metálicas como ganchos, hebillas, aros en \"D\", cuerpo del equipo, entre otros (revise daños como corrosión, torceduras, partes desgastadas o sueltas, fisuras, hundidas o deformadas)",
      "Buen estado del sistema de apertura y cierre automático del seguro del equipo.",
      "Buen funcionamiento de la palanca multifuncional y sistema de auto bloqueo",
      "Las estrías de la leva de los bloqueadores están libres de daño excesivo",
      "Partes plásticas (revise la ausencia, desgaste o partes sueltas, fisuradas)",
      "Guarda cabos, funda y alma en buen estado"
    ]
  },
  {
    title: "HERRAMIENTAS MANUALES",
    items: [
      "Herramientas libres de daños visibles.",
      "La herramienta cuenta con mangos que permiten el fácil agarre y disminuyen el deslizamiento involuntario de la mano.",
      "La herramienta en general, se encuentra correctamente afilada y ajustada, libre de fisuras, rebabas, alambres, fracturas, asperezas o reparaciones hechizas.",
      "Las herramientas están diseñadas específicamente para la tarea (no son hechizas).",
      "La herramienta cuenta con las dimensiones propias para la labor",
      "Las seguetas están bien acopladas al marco y las hojas están en buen estado.",
      "El tornillo de sujeción o pasador de la articulación de las pinza, alicates o tenazas, permite abrir y cerrar las pinzas fácilmente."
    ]
  },
  {
    title: "HERRAMIENTAS MECANIZADAS",
    items: [
      "Los equipos poseen aislamiento dieléctrico y su clavija se encuentra en buen estado.",
      "Se apaga el equipo antes de realizar el cambio de discos, brocas, puntas o cuchillas.",
      "Se hace uso de las llaves adecuadas para realizar el cambio de discos, brocas y cuchillas.",
      "Los discos, brocas, puntas, cuchillas y piezas clave se encuentran en buen estado",
      "Las rpm (revoluciones por minuto) de la pulidora, no son superiores a la capacidad del disco empleado.",
      "Los cables poseen aislamiento doble, polo a tierra y se encuentren libres de daño.",
      "Las conexiones de las mangueras neumáticas, cuentan con mecanismos de seguridad como pines \"r\" y/o sistema anti látigo.",
      "Las mangueras y el equipos en general se encuentran en buen estado y no presentan fugas (aire, aceite, gasolina, refrigerante...)",
      "El equipo cuentan con todas sus piezas bien ajustadas (guardas de seguridad, manijas de sujeción, resguardos, carcasas, etc.…)",
      "El tubo de escape cuenta con guarda y silenciador",
      "Guayas y pasadores en buen estado"
    ]
  }
];

// Mapeo de campos para la tabla
const camposDB = [
  // CONDICIONES DE SALUD, COMPETENCIA LABORAL Y EPP
  "sintoma_malestar_fisico",
  "uso_medicamentos_que_afecten_alerta",
  "consumo_sustancias_12h",
  "condiciones_fisicas_tareas_criticas",
  "competencia_vigente_tarea_critica",
  "proteccion_cabeza_buen_estado",
  "proteccion_auditiva_buen_estado",
  "proteccion_visual_buen_estado",
  "proteccion_respiratoria_buen_estado",
  "guantes_proteccion_buen_estado",
  "ropa_trabajo_buen_estado",
  "botas_seguridad_buen_estado",
  "otros_epp_buen_estado",
  // EPCC - EQUIPOS DE PROTECCIÓN CONTRA CAÍDAS
  "etiqueta_en_buen_estado",
  "compatibilidad_sistema_proteccion",
  "absorbedor_impacto_buen_estado",
  "cintas_tiras_buen_estado",
  "costuras_buen_estado",
  "indicadores_impacto_buen_estado",
  "partes_metalicas_buen_estado",
  "sistema_cierre_automatico_buen_estado",
  "palanca_multifuncional_buen_funcionamiento",
  "estrias_leva_libres_dano",
  "partes_plasticas_buen_estado",
  "guarda_cabos_funda_alma_buen_estado",
  // HERRAMIENTAS MANUALES
  "herramientas_libres_danos_visibles",
  "mangos_facil_agarre",
  "herramientas_afiladas_ajustadas",
  "herramientas_disenadas_tarea",
  "herramientas_dimensiones_correctas",
  "seguetas_bien_acopladas",
  "pinzas_buen_funcionamiento",
  // HERRAMIENTAS MECANIZADAS
  "aislamiento_dieletrico_buen_estado",
  "apaga_equipo_para_cambio_discos",
  "uso_llaves_adecuadas_cambio_discos",
  "discos_brocas_puntas_buen_estado",
  "rpm_no_supera_capacidad_disco",
  "cables_aislamiento_doble_buen_estado",
  "conexiones_neumaticas_seguras",
  "mangueras_y_equipos_sin_fugas",
  "piezas_ajustadas_correctamente",
  "tubo_escape_con_guarda_silenciador",
  "guayas_pasadores_buen_estado"
];

function getColombiaDateString() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

function getCurrentWeekKey() {
  const now = new Date();
  const firstJan = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - firstJan) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + firstJan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}
function isSunday() {
  return new Date().getDay() === 0;
}

/**
 * InspeccionEpccBomberman — formulario semanal de inspección EPCC (equipos de protección contra caídas).
 * Cubre condiciones de salud, EPP, EPCC, herramientas manuales y herramientas mecanizadas.
 * Persiste las respuestas semanalmente en localStorage; las limpia los domingos.
 * Envía mediante POST a /bomberman/inspeccion_epcc_bomberman.
 */
function inspeccion_epcc_bomberman() {
  const [datosGenerales, setDatosGenerales] = useState({
    nombre_cliente: "",
    nombre_proyecto: "",
    fecha: "",
    nombre_operador: "",
    cargo: ""
  });
  const [respuestas, setRespuestas] = useState({});
  const [observaciones, setObservaciones] = useState("");
  const [errores, setErrores] = useState({});
  const [mostrarFlechaGuardar, setMostrarFlechaGuardar] = useState(false);
  const guardarBtnRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const nombre_proyecto = localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "";
    const nombre_operador = localStorage.getItem("nombre_trabajador") || "";
    const fechaHoy = getColombiaDateString();

    axios.get(`${API_BASE_URL}/obras`)
      .then(res => {
        let obras = [];
        if (Array.isArray(res.data.obras)) obras = res.data.obras;
        const obra = obras.find(o => o.nombre_obra === nombre_proyecto);
        const constructora = obra ? obra.constructora : "";
        setDatosGenerales({
          nombre_cliente: constructora,
          nombre_proyecto: nombre_proyecto,
          fecha: fechaHoy,
          nombre_operador,
          cargo: localStorage.getItem("cargo_trabajador") || ""
        });
      })
      .catch(() => {
        setDatosGenerales({
          nombre_cliente: "",
          nombre_proyecto: nombre_proyecto,
          fecha: fechaHoy,
          nombre_operador,
          cargo: localStorage.getItem("cargo_trabajador") || ""
        });
      });
  }, []);

  useEffect(() => {
    const weekKey = getCurrentWeekKey();
    const saved = localStorage.getItem("bomberman_inspeccion_epcc_respuestas");
    let shouldClear = false;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isSunday() || parsed.weekKey !== weekKey) {
          shouldClear = true;
        } else {
          setDatosGenerales(parsed.datosGenerales || {
            nombre_cliente: "",
            nombre_proyecto: "",
            fecha: "",
            nombre_operador: "",
            cargo: ""
          });
          setRespuestas(parsed.respuestas || {});
          setObservaciones(parsed.observaciones || "");
        }
      } catch {
        shouldClear = true;
      }
    }
    if (shouldClear) {
      localStorage.removeItem("bomberman_inspeccion_epcc_respuestas");
      setDatosGenerales({
        nombre_cliente: "",
        nombre_proyecto: "",
        fecha: "",
        nombre_operador: "",
        cargo: ""
      });
      setRespuestas({});
      setObservaciones("");
    }
    // eslint-disable-next-line
  }, []);

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setDatosGenerales(prev => ({ ...prev, [name]: value }));
    setErrores(prev => ({ ...prev, [name]: false }));
  };

  const handleRespuestaChange = (seccionIdx, itemIdx, value) => {
    setRespuestas(prev => ({
      ...prev,
      [`${seccionIdx}_${itemIdx}`]: value
    }));
    setErrores(prev => ({ ...prev, [`${seccionIdx}_${itemIdx}`]: false }));
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
      setMostrarFlechaGuardar(false);
    }
  };

  const validarCamposObligatorios = () => {
    const erroresTemp = {};
    let primerError = null;

    // nombre_cliente omitted — backend accepts empty value if /obras fetch fails
    ["nombre_proyecto", "fecha", "nombre_operador", "cargo"].forEach(field => {
      if (!datosGenerales[field] || datosGenerales[field].toString().trim() === "") {
        erroresTemp[field] = true;
        if (!primerError) primerError = field;
      }
    });

    let idxCampo = 0;
    secciones.forEach((seccion, seccionIdx) => {
      seccion.items.forEach((item, itemIdx) => {
        const key = `${seccionIdx}_${itemIdx}`;
        if (!respuestas[key] || respuestas[key].trim() === "") {
          erroresTemp[key] = true;
          if (!primerError) primerError = key;
        }
        idxCampo++;
      });
    });

    setErrores(erroresTemp);

    if (primerError) {
      setMostrarFlechaGuardar(true);
      scrollToItem(primerError);
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    let idxCampo = 0;
    const campos = {};
    secciones.forEach((seccion, seccionIdx) => {
      seccion.items.forEach((item, itemIdx) => {
        const dbField = camposDB[idxCampo];
        campos[dbField] = respuestas[`${seccionIdx}_${itemIdx}`] || "";
        idxCampo++;
      });
    });
    return {
      nombre_cliente: datosGenerales.nombre_cliente, // Antes: cliente_constructora
      nombre_proyecto: datosGenerales.nombre_proyecto, // Antes: proyecto_constructora
      fecha_servicio: datosGenerales.fecha, // Antes: fecha_registro
      nombre_operador: datosGenerales.nombre_operador, // Sin cambio
      cargo: datosGenerales.cargo, // Antes: cargo_operador
      ...campos,
      observaciones_generales: observaciones
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarCamposObligatorios()) return;

    const payload = buildPayload();

    const weekKey = getCurrentWeekKey();
    localStorage.setItem(
      "bomberman_inspeccion_epcc_respuestas",
      JSON.stringify({
        weekKey,
        datosGenerales,
        respuestas,
        observaciones,
      })
    );

    try {
      await axios.post(`${API_BASE_URL}/bomberman/inspeccion_epcc_bomberman`, payload, {
        headers: { "Content-Type": "application/json" }
      });
      window.alert("Inspección guardada correctamente en backend.");
      setMostrarFlechaGuardar(false);
      navigate(-1);
    } catch (err) {
      window.alert(`Error al guardar inspección: ${err?.response?.data?.message || err.message}`);
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="card-section" style={{ marginBottom: 16 }}>
        <h3 className="card-title">Datos Generales</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ width: "93%" }}>
            <label className="label">Cliente / Constructora</label>
            <input
              type="text"
              name="nombre_cliente"
              value={datosGenerales.nombre_cliente}
              readOnly
              className="permiso-trabajo-input"
              style={{ width: "100%" }}
              id="nombre_cliente"
            />
          </div>
          <div style={{ width: "93%" }}>
            <label className="label">Proyecto / Constructora</label>
            <input
              type="text"
              name="nombre_proyecto"
              value={datosGenerales.nombre_proyecto}
              readOnly
              className="permiso-trabajo-input"
              style={{ width: "100%" }}
              id="nombre_proyecto"
            />
          </div>
          <div style={{ width: "93%" }}>
            <label className="label">Fecha</label>
            <input
              type="date"
              name="fecha"
              value={datosGenerales.fecha}
              readOnly
              className="permiso-trabajo-input"
              style={{ width: "100%" }}
              id="fecha"
            />
          </div>
          <div style={{ width: "93%" }}>
            <label className="label">Trabajador autorizado</label>
            <input
              type="text"
              name="nombre_operador"
              value={datosGenerales.nombre_operador}
              readOnly
              className="permiso-trabajo-input"
              style={{ width: "100%" }}
              id="nombre_operador"
            />
          </div>
          <div style={{ width: "93%" }}>
            <label className="label">Cargo</label>
            <input
              type="text"
              name="cargo"
              value={datosGenerales.cargo}
              onChange={handleGeneralChange}
              className={`permiso-trabajo-input${errores["cargo"] ? " campo-error" : ""}`}
              style={errores["cargo"] ? { width: "100%", borderColor: "red", background: "#ffeaea" } : { width: "100%" }}
              id="cargo"
            />
            {mostrarFlechaGuardar && errores["cargo"] && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                <span style={{ color: "red", fontSize: 13 }}>
                  Obligatorio
                </span>
              </div>
            )}
            {!mostrarFlechaGuardar && errores["cargo"] && (
              <span style={{ color: "red", fontSize: 13 }}>
                Obligatorio
              </span>
            )}
          </div>
        </div>
      </div>

      {secciones.map((seccion, seccionIdx) => (
        <div className="card-section" style={{ marginBottom: 16 }} key={seccion.title}>
          <h3 className="card-title">{seccion.title}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {seccion.items.map((item, itemIdx) => {
              const key = `${seccionIdx}_${itemIdx}`;
              return (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    border: "1px solid #ececec"
                  }}
                  id={key}
                >
                  <div style={{ flex: 1 }}>
                    <span className="permiso-trabajo-label">{item}</span>
                  </div>
                  <select
                    value={respuestas[key] || ""}
                    onChange={e => handleRespuestaChange(seccionIdx, itemIdx, e.target.value)}
                    className={`permiso-trabajo-select${errores[key] ? " campo-error" : ""}`}
                    style={errores[key] ? { width: 120, borderColor: "red", background: "#ffeaea" } : { width: 120 }}
                    id={key}
                  >
                    <option value="">--</option>
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                    <option value="NA">NA</option>
                  </select>
                  {mostrarFlechaGuardar && errores[key] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                      <span style={{ color: "red", fontSize: 13 }}>
                        Obligatorio
                      </span>
                    </div>
                  )}
                  {!mostrarFlechaGuardar && errores[key] && (
                    <span style={{ color: "red", fontSize: 13 }}>
                      Obligatorio
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="card-section">
        <label className="permiso-trabajo-label">Observaciones Generales</label>
        <textarea
          className="permiso-trabajo-textarea"
          style={{ width: "93%", minHeight: 80 }}
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
        />
      </div>

      <div style={{ textAlign: "right", marginTop: 18 }}>
        <button type="submit" className="button" style={{ background: "#ff9800", color: "#fff" }} ref={guardarBtnRef}>
          Guardar
        </button>
      </div>
    </form>
  );
}

export default inspeccion_epcc_bomberman;
