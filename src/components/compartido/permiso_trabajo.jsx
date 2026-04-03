import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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
 * PermisoTrabajo — formulario de permiso de trabajo con múltiples secciones.
 * Gestiona datos generales, tareas, herramientas, trabajadores, EPP/SRPDC, equipos de acceso,
 * medidas de prevención y sección de cierre. Persiste las respuestas semanalmente en localStorage.
 *
 * @param {Object}   props
 * @param {Function} [props.onFinish]  Se llama tras un POST exitoso a /compartido/permiso_trabajo.
 */
function PermisoTrabajo(props) {
  const [generales, setGenerales] = useState({
    cliente: "",
    proyecto: "",
    fecha: "",
    operador: "",
    observaciones: "",
  });

  const tareasInicial = {
    ascenso_descenso: false,
    alistamiento_bomba: false,
    armado_tuberia: false,
    bombeo_concreto: false,
    izaje_cargas: false,
    verif_mantenimiento_electrico: false,
    montaje_torre_elevador: false,
    desmontaje_torre: false,
    telescopaje: false,
  };
  const [tareas, setTareas] = useState(tareasInicial);

  const descripcionOpciones = [
    "ASCENSO Y DESCENSO DE TORRE GRÚA",
    "ALISTAMIENTO DE BOMBA",
    "ARMADO DE TUBERÍA",
    "BOMBEO DE CONCRETO",
    "IZAJE DE CARGAS CON TORRE GRUA (Operación torre grua)",
    "VERIFICACION Y/O MANTENIMIENTO ELECTRICO MECANICO",
    "MONTAJE DE TORRE GRUA / ELEVADOR DE CARGA",
    "DESMONTAJE DE TORRE GRUA / ELEVADOR DE CARGA",
    "TELESCOPAJE DE TORRE GRUA / ELEVADOR DE CARGA",
  ];

  const [descripcion, setDescripcion] = useState("");
  const [herramientas, setHerramientas] = useState("");
  const [herramientasLista, setHerramientasLista] = useState({
    MARTILLO: false,
    LLAVES: false,
    "PALANCA DE FUERZA": false,
    ALMADANA: false,
    NIVEL: false,
    ESPÁTULA: false,
    ALICATE: false,
    PINZAS: false,
    "PALUSTRE PALA BARRA": false,
    DECAMETRO: false,
    PICA: false,
    "PALA DRAGA": false,
    MACHETE: false,
    "CORTA FRIO": false,
    MULTIMETRO: false,
    FLEXOMETRO: false,
    CINCEL: false,
  });

  const toggleHerramienta = (key) => {
    setHerramientasLista((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [trabajadores, setTrabajadores] = useState([
    { id: 1, numero_id: "", nombres: "", cargo: "", apto: false, ppe: false, observacion: "" },
  ]);

  const [medidasPrevencion, setMedidasPrevencion] = useState({
    procedimiento: false,
    info_y_demarcacion: false,
    epp_correcto: false,
    inspeccion_previas: false,
    plan_rescate: false,
  });

  const [equiposAcceso, setEquiposAcceso] = useState({
    escaleras: false,
    vertical_fija: false,
    portal: false,
    andamios: false,
    colgante: false,
    elevador_carga: false,
    canastilla: false,
    ascensores_personas: false,
  });

  const [firmas, setFirmas] = useState({
    trabajador_autorizado: "",
    cargo_autorizado: "",
    firma_coordinador: "",
    fecha_validacion: "",
  });

  const [trabajoRutinario, setTrabajoRutinario] = useState("");
  const [alturaTiene, setAlturaTiene] = useState("");
  const [alturaInicial, setAlturaInicial] = useState("");
  const [alturaFinal, setAlturaFinal] = useState("");

  const [requisitosAptitud, setRequisitosAptitud] = useState({
    explicacion_procedimiento: false,
    buenas_condiciones_salud: false,
    entiende_ats: false,
    consumio_alimentos: false,
    dormio_suficiente: false,
    no_bebidas_embriagantes: false,
    sin_accesorios: false,
    sin_medicamentos: false,
    capacitado_certificado: false,
  });

  const [epp, setEpp] = useState({
    cuenta_certificado_alturas: "",
    seguridad_social_arl: "",
    casco_tipo1: "",
    gafas: "",
    proteccion_auditiva: "",
    proteccion_respiratoria: "",
    guantes_seguridad: "",
    botas_dielectricas: "",
    overol_dotacion: "",
  });

  const [srpdc, setSrpdc] = useState({
    arnes_cuerpo_entero: "",
    arnes_dielectrico: "",
    mosqueton: "",
    arrestador_caidas: "",
    eslinga_y_absorbedor: "",
    eslinga_posicionamiento: "",
    linea_vida: "",
    verificacion_anclaje: "",
  });

  const [precaucionesGenerales, setPrecaucionesGenerales] = useState({
    procedimiento_charla: "",
    medidas_colectivas_prevencion: "",
    epp_epcc_inspeccion: "",
    equipos_herramientas_inspeccion: "",
    inspeccion_sistema_ta: "",
    plan_emergencias_rescate: "",
    medidas_caida_objetos: "",
    kit_rescate: "",
    permiso_trabajo_ats: "",
    verificacion_atmosfericas: "",
    distancia_vertical_caida: "",
    otro: "",
  });

  const [equiposAccesoP8, setEquiposAccesoP8] = useState({
    vertical_fija: "",
    vertical_portatil: "",
    andamio_multidireccional: "",
    andamio_colgante: "",
    elevador_carga: "",
    canastilla: "",
    ascensor_personas: "",
    acceso_cuerdas: "",
    otro: "",
  });

  const [modalCierreOpen, setModalCierreOpen] = useState(false);
  const [cierrePermiso, setCierrePermiso] = useState({ cierre: "", motivo: "", nombre: "" });
  const [cierrePermisoGuardado, setCierrePermisoGuardado] = useState(false);

  const [modalCierreLaborOpen, setModalCierreLaborOpen] = useState(false);
  const [cierreLabor, setCierreLabor] = useState({ trabajador_nombre: "", coordinador_nombre: "" });
  const [cierreLaborGuardado, setCierreLaborGuardado] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const nombre_proyecto =
      localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "";

    const nombre_operador =
      localStorage.getItem("nombre_trabajador") ||
      localStorage.getItem("operador") ||
      "";

    const fechaHoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

    const weekKey = getCurrentWeekKey();
    const saved = localStorage.getItem("permiso_trabajo_respuestas");
    let datosGuardados = null;

    if (saved && !isSunday()) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.weekKey === weekKey) {
          datosGuardados = parsed;
        } else {
          localStorage.removeItem("permiso_trabajo_respuestas");
        }
      } catch (e) {
        localStorage.removeItem("permiso_trabajo_respuestas");
      }
    } else if (isSunday()) {
      localStorage.removeItem("permiso_trabajo_respuestas");
    }

    if (datosGuardados) {
      setTareas(datosGuardados.tareas || tareasInicial);
      setDescripcion(datosGuardados.descripcion || "");
      setHerramientas(datosGuardados.herramientas || "");
      setHerramientasLista(
        datosGuardados.herramientasLista || {
          MARTILLO: false, LLAVES: false, "PALANCA DE FUERZA": false,
          ALMADANA: false, NIVEL: false, ESPÁTULA: false, ALICATE: false,
          PINZAS: false, "PALUSTRE PALA BARRA": false, DECAMETRO: false,
          PICA: false, "PALA DRAGA": false, MACHETE: false, "CORTA FRIO": false,
          MULTIMETRO: false, FLEXOMETRO: false, CINCEL: false,
        }
      );
      setTrabajadores(
        datosGuardados.trabajadores || [
          { id: 1, numero_id: "", nombres: "", cargo: "", apto: false, ppe: false, observacion: "" },
        ]
      );
      setMedidasPrevencion(datosGuardados.medidasPrevencion || {
        procedimiento: false, info_y_demarcacion: false, epp_correcto: false,
        inspeccion_previas: false, plan_rescate: false,
      });
      setEquiposAcceso(datosGuardados.equiposAcceso || {
        escaleras: false, vertical_fija: false, portal: false, andamios: false,
        colgante: false, elevador_carga: false, canastilla: false, ascensores_personas: false,
      });
      setTrabajoRutinario(datosGuardados.trabajoRutinario || "");
      setAlturaTiene(datosGuardados.alturaTiene || "");
      setAlturaInicial(datosGuardados.alturaInicial || "");
      setAlturaFinal(datosGuardados.alturaFinal || "");
      setRequisitosAptitud(datosGuardados.requisitosAptitud || {
        explicacion_procedimiento: false, buenas_condiciones_salud: false,
        entiende_ats: false, consumio_alimentos: false, dormio_suficiente: false,
        no_bebidas_embriagantes: false, sin_accesorios: false,
        sin_medicamentos: false, capacitado_certificado: false,
      });
      setEpp(datosGuardados.epp || {
        cuenta_certificado_alturas: "", seguridad_social_arl: "", casco_tipo1: "",
        gafas: "", proteccion_auditiva: "", proteccion_respiratoria: "",
        guantes_seguridad: "", botas_dielectricas: "", overol_dotacion: "",
      });
      setSrpdc(datosGuardados.srpdc || {
        arnes_cuerpo_entero: "", arnes_dielectrico: "", mosqueton: "",
        arrestador_caidas: "", eslinga_y_absorbedor: "", eslinga_posicionamiento: "",
        linea_vida: "", verificacion_anclaje: "",
      });
      setPrecaucionesGenerales(datosGuardados.precaucionesGenerales || {
        procedimiento_charla: "", medidas_colectivas_prevencion: "",
        epp_epcc_inspeccion: "", equipos_herramientas_inspeccion: "",
        inspeccion_sistema_ta: "", plan_emergencias_rescate: "",
        medidas_caida_objetos: "", kit_rescate: "", permiso_trabajo_ats: "",
        verificacion_atmosfericas: "", distancia_vertical_caida: "", otro: "",
      });
      setEquiposAccesoP8(datosGuardados.equiposAccesoP8 || {
        vertical_fija: "", vertical_portatil: "", andamio_multidireccional: "",
        andamio_colgante: "", elevador_carga: "", canastilla: "",
        ascensor_personas: "", acceso_cuerdas: "", otro: "",
      });

      setFirmas({
        ...(datosGuardados.firmas || {}),
        trabajador_autorizado: nombre_operador,
      });
    } else {
      setFirmas((prev) => ({ ...prev, trabajador_autorizado: nombre_operador }));
    }

    axios
      .get(`${API_BASE_URL}/obras`)
      .then((res) => {
        const obras = Array.isArray(res.data.obras) ? res.data.obras : [];
        const obra_seleccionada = obras.find((o) => o.nombre_obra === nombre_proyecto);
        const constructora = obra_seleccionada ? obra_seleccionada.constructora : "";
        setGenerales((prev) => ({
          ...prev,
          cliente: constructora,
          proyecto: nombre_proyecto,
          operador: nombre_operador,
          fecha: fechaHoy,
        }));
      })
      .catch(() => {
        setGenerales((prev) => ({
          ...prev,
          cliente: "",
          proyecto: nombre_proyecto,
          operador: nombre_operador,
          fecha: fechaHoy,
        }));
      });
    // eslint-disable-next-line
  }, []);

  const handleGeneralChange = (e) => {
    setGenerales({ ...generales, [e.target.name]: e.target.value });
  };

  const handleTareaChange = (e) => {
    setTareas({ ...tareas, [e.target.name]: e.target.checked });
  };

  const handleMedidaChange = (e) => {
    setMedidasPrevencion({ ...medidasPrevencion, [e.target.name]: e.target.checked });
  };

  const handleEquipoChange = (e) => {
    setEquiposAcceso({ ...equiposAcceso, [e.target.name]: e.target.checked });
  };

  const addTrabajador = () => {
    setTrabajadores([
      ...trabajadores,
      { id: Date.now(), numero_id: "", nombres: "", cargo: "", apto: false, ppe: false, observacion: "" },
    ]);
  };

  const removeTrabajador = (id) => {
    setTrabajadores(trabajadores.filter((t) => t.id !== id));
  };

  const handleTrabajadorChange = (id, field, value) => {
    setTrabajadores(
      trabajadores.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleRequisitosChange = (e) => {
    setRequisitosAptitud({ ...requisitosAptitud, [e.target.name]: e.target.checked });
  };

  const handleEppChange = (e) => {
    setEpp({ ...epp, [e.target.name]: e.target.value });
  };

  const handleSrpdcChange = (e) => {
    setSrpdc({ ...srpdc, [e.target.name]: e.target.value });
  };

  const handlePrecaucionesChange = (e) => {
    setPrecaucionesGenerales({ ...precaucionesGenerales, [e.target.name]: e.target.value });
  };

  const handleEquiposAccesoP8Change = (e) => {
    setEquiposAccesoP8({ ...equiposAccesoP8, [e.target.name]: e.target.value });
  };

  const handleCierrePermisoChange = (e) => {
    setCierrePermiso({ ...cierrePermiso, [e.target.name]: e.target.value });
  };

  const handleCierreLaborChange = (e) => {
    setCierreLabor({ ...cierreLabor, [e.target.name]: e.target.value });
  };

  const handleGuardar = async () => {
    const nombre_operador_actual =
      localStorage.getItem("nombre_trabajador") ||
      localStorage.getItem("operador") ||
      firmas.trabajador_autorizado ||
      "";

    // cliente omitted from required fields — backend accepts empty value if /obras fails
    if (!generales.proyecto) {
      alert("Completa los datos generales: proyecto.");
      return;
    }

    if (!nombre_operador_actual) {
      alert("No se encontró el nombre del operador. Por favor vuelve a iniciar sesión.");
      return;
    }

    const payload = {
      nombre_cliente: generales.cliente,
      nombre_proyecto: generales.proyecto,
      fecha_servicio: generales.fecha,
      nombre_operador: nombre_operador_actual,
      cargo: firmas.cargo_autorizado,
      trabajo_rutinario: trabajoRutinario,
      tarea_en_alturas: alturaTiene,
      altura_inicial: alturaTiene === "SI" ? alturaInicial : "0",
      altura_final: alturaTiene === "SI" ? alturaFinal : "0",
      herramientas_seleccionadas: Object.keys(herramientasLista)
        .filter((k) => herramientasLista[k])
        .join(","),
      herramientas_otros: herramientas,
      certificado_alturas: epp.cuenta_certificado_alturas,
      seguridad_social_arl: epp.seguridad_social_arl,
      casco_tipo1: epp.casco_tipo1,
      gafas_seguridad: epp.gafas,
      proteccion_auditiva: epp.proteccion_auditiva,
      proteccion_respiratoria: epp.proteccion_respiratoria,
      guantes_seguridad: epp.guantes_seguridad,
      botas_punta_acero: epp.botas_dielectricas,
      ropa_reflectiva: epp.overol_dotacion,
      arnes_cuerpo_entero: srpdc.arnes_cuerpo_entero,
      arnes_cuerpo_entero_dielectrico: srpdc.arnes_dielectrico,
      mosqueton: srpdc.mosqueton,
      arrestador_caidas: srpdc.arrestador_caidas,
      eslinga_absorbedor: srpdc.eslinga_y_absorbedor,
      eslinga_posicionamiento: srpdc.eslinga_posicionamiento,
      linea_vida: srpdc.linea_vida,
      eslinga_doble: "NA",
      verificacion_anclaje: srpdc.verificacion_anclaje,
      procedimiento_charla: precaucionesGenerales.procedimiento_charla,
      medidas_colectivas_prevencion: precaucionesGenerales.medidas_colectivas_prevencion,
      epp_epcc_buen_estado: precaucionesGenerales.epp_epcc_inspeccion,
      equipos_herramienta_buen_estado: precaucionesGenerales.equipos_herramientas_inspeccion,
      inspeccion_sistema: precaucionesGenerales.inspeccion_sistema_ta,
      plan_emergencia_rescate: precaucionesGenerales.plan_emergencias_rescate,
      medidas_caida: precaucionesGenerales.medidas_caida_objetos,
      kit_rescate: precaucionesGenerales.kit_rescate,
      permisos: precaucionesGenerales.permiso_trabajo_ats,
      condiciones_atmosfericas: precaucionesGenerales.verificacion_atmosfericas,
      distancia_vertical_caida: precaucionesGenerales.distancia_vertical_caida,
      otro_precausiones: precaucionesGenerales.otro,
      vertical_fija: equiposAccesoP8.vertical_fija,
      vertical_portatil: equiposAccesoP8.vertical_portatil,
      andamio_multidireccional: equiposAccesoP8.andamio_multidireccional,
      andamio_colgante: equiposAccesoP8.andamio_colgante,
      elevador_carga: equiposAccesoP8.elevador_carga,
      canasta: equiposAccesoP8.canastilla,
      ascensores: equiposAccesoP8.ascensor_personas,
      acceso_cuerdas: equiposAccesoP8.acceso_cuerdas,
      otro_equipos: equiposAccesoP8.otro,
      observaciones: generales.observaciones || "",
      motivo_suspension: cierrePermiso.motivo,
      nombre_suspende: cierrePermiso.nombre || "",
      nombre_responsable: cierreLabor.trabajador_nombre || "",
      nombre_coordinador: cierreLabor.coordinador_nombre,
    };

    try {
      await axios.post(`${API_BASE_URL}/compartido/permiso_trabajo`, payload);

      const weekKey = getCurrentWeekKey();
      localStorage.setItem(
        "permiso_trabajo_respuestas",
        JSON.stringify({
          weekKey,
          generales: { ...generales, operador: nombre_operador_actual },
          firmas: { ...firmas, trabajador_autorizado: nombre_operador_actual },
          tareas,
          descripcion,
          herramientas,
          herramientasLista,
          trabajadores,
          medidasPrevencion,
          equiposAcceso,
          trabajoRutinario,
          alturaTiene,
          alturaInicial,
          alturaFinal,
          requisitosAptitud,
          epp,
          srpdc,
          precaucionesGenerales,
          equiposAccesoP8,
        })
      );

      alert("Permiso de trabajo guardado correctamente.");
      if (props.onFinish) props.onFinish();
      navigate(-1);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Error al guardar el permiso de trabajo.";
      alert("Error al guardar el permiso de trabajo: " + msg);
    }
  };

  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">Datos Generales</h3>
        <label className="label">Cliente / Constructora</label>
        <input
          name="cliente"
          placeholder="Cliente / Constructora"
          value={generales.cliente}
          onChange={handleGeneralChange}
          readOnly
        />
        <label className="label">Proyecto / Constructora</label>
        <input
          name="proyecto"
          placeholder="Proyecto / Constructora"
          value={generales.proyecto}
          onChange={handleGeneralChange}
          readOnly
        />
        <label className="label">Fecha</label>
        <input
          type="date"
          name="fecha"
          value={generales.fecha}
          onChange={handleGeneralChange}
          readOnly
        />
        <div style={{ marginTop: 16 }}>
          <input
            placeholder="Trabajador autorizado - nombre"
            value={firmas.trabajador_autorizado}
            onChange={(e) => setFirmas({ ...firmas, trabajador_autorizado: e.target.value })}
            readOnly
          />
          <input
            placeholder="Cargo trabajador"
            value={firmas.cargo_autorizado}
            onChange={(e) => setFirmas({ ...firmas, cargo_autorizado: e.target.value })}
          />
          <input
            placeholder="Firma coordinador"
            value={firmas.firma_coordinador}
            onChange={(e) => setFirmas({ ...firmas, firma_coordinador: e.target.value })}
          />
        </div>
      </div>

      <div className="card-section">
        <h3 className="card-title">Trabajo rutinario y altura</h3>
        <label className="label">¿Fué un trabajo rutinario?</label>
        <div>
          <select
            name="trabajo_rutinario"
            value={trabajoRutinario}
            onChange={(e) => setTrabajoRutinario(e.target.value)}
          >
            <option value="">--</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
            <option value="NA">NA</option>
          </select>
        </div>
        <label className="label">¿Fué una tarea en alturas?</label>
        <div>
          <select
            name="altura_tiene"
            value={alturaTiene}
            onChange={(e) => {
              setAlturaTiene(e.target.value);
              if (e.target.value !== "SI") {
                setAlturaInicial("");
                setAlturaFinal("");
              }
            }}
          >
            <option value="">--</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
            <option value="NA">NA</option>
          </select>
        </div>
        {alturaTiene === "SI" && (
          <>
            <label className="label">¿Cuál fue la altura aproximada de la tarea?</label>
            <div>
              <input
                placeholder="INICIAL"
                value={alturaInicial}
                onChange={(e) => setAlturaInicial(e.target.value)}
              />
              <input
                placeholder="FINAL"
                value={alturaFinal}
                onChange={(e) => setAlturaFinal(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="card-section">
        <h3 className="card-title">Descripción y procedimiento de la tarea</h3>
        <label className="label">Selecciona la tarea que vas a realizar</label>
        <select
          name="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        >
          <option value="">-- Selecciona la tarea a realizar --</option>
          {descripcionOpciones.map((op, i) => (
            <option key={i} value={op}>
              {op}
            </option>
          ))}
        </select>
      </div>

      <div className="card-section">
        <h3 className="card-title">Herramientas a utilizar</h3>
        <label className="label">Selecciona las herramientas que utilizaste</label>
        <div className="herramientas-grid">
          {Object.keys(herramientasLista).map((k) => (
            <div
              key={k}
              className={`herramienta-item herramienta-recuadro${herramientasLista[k] ? " herramienta-seleccionada" : ""}`}
              onClick={() => toggleHerramienta(k)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") toggleHerramienta(k);
              }}
              role="button"
              aria-pressed={herramientasLista[k]}
              style={{ userSelect: "none", cursor: "pointer" }}
            >
              <span className="herramienta-nombre">{k}</span>
            </div>
          ))}
        </div>
        <label className="label">Otros (describa)</label>
        <input
          value={herramientas}
          onChange={(e) => setHerramientas(e.target.value)}
          placeholder="Otros instrumentos"
        />
      </div>

      <div className="card-section">
        <h3 className="card-title">Trabajadores autorizados para realizar TA</h3>
        <label className="label">Requisitos de Aptitud</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div> - Me explicaron el procedimiento y me siento capaz de ejecutarlo</div>
          <div> - Me encuentro en buenas condiciones de salud para realizar el Trabajo en alturas</div>
          <div> - Entiendo la actividad a realizar y el Análisis de Trabajo Seguro (ATS)</div>
          <div> - He consumido alimentos en las últimas 4hrs</div>
          <div> - He dormido 6hrs o más antes de iniciar la actividad</div>
          <div> - En las últimas 48hrs NO he consumido bebidas embriagantes y/u otras sustancias que puedan poner en peligro mi vida durante la actividad.</div>
          <div> - Me he retirado cadenas, relojes, anillos, pulseras y/o cualquier otro elemento que pueda afectar mi seguridad durante la ejecución de la actividad</div>
          <div> - No estoy tomando ningún medicamento que afecte mis condiciones para el TA</div>
          <div> - He sido capacitado y certificado en competencia laboral como TRABAJADOR AUTORIZADO N para la prevención para caídas en TA.</div>
        </div>
      </div>

      <div className="card-section">
        <h3 className="card-title">EPP y SRPDC</h3>
        <div>
          <div>6.2 EPP</div>
          <div>
            {[
              { key: "cuenta_certificado_alturas", label: "Cuenta con certificado alturas" },
              { key: "seguridad_social_arl", label: "Seguridad social vigente / ARL Riesgo 5" },
              { key: "casco_tipo1", label: "Casco Tipo1 con barbuquejo 3 Puntos" },
              { key: "gafas", label: "Gafas" },
              { key: "proteccion_auditiva", label: "Protección auditiva" },
              { key: "proteccion_respiratoria", label: "Protección respiratoria" },
              { key: "guantes_seguridad", label: "Guantes de seguridad" },
              { key: "botas_dielectricas", label: "Botas dieléctricas con puntera" },
              { key: "overol_dotacion", label: "Overol y/o prendas de dotación" },
            ].map((item) => (
              <div key={item.key}>
                <span>{item.label}</span>
                <select name={item.key} value={epp[item.key]} onChange={handleEppChange}>
                  <option value="">--</option>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                  <option value="NA">NA</option>
                </select>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div>6.3 SRPDC y EPCC</div>
          <div>
            {[
              { key: "arnes_cuerpo_entero", label: "Arnés cuerpo entero" },
              { key: "arnes_dielectrico", label: "Arnés cuerpo entero dieléctrico" },
              { key: "mosqueton", label: "Mosquetón" },
              { key: "arrestador_caidas", label: "Arrestador de caídas" },
              { key: "eslinga_y_absorbedor", label: "Eslinga Y con absorbedor" },
              { key: "eslinga_posicionamiento", label: "Eslinga posicionamiento y/o" },
              { key: "linea_vida", label: "Línea de vida vertical y/o horizontal" },
              { key: "verificacion_anclaje", label: "Verificación puntos de anclaje" },
            ].map((item) => (
              <div key={item.key}>
                <span>{item.label}</span>
                <select name={item.key} value={srpdc[item.key]} onChange={handleSrpdcChange}>
                  <option value="">--</option>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                  <option value="NA">NA</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-section">
        <h3 className="card-title">Medidas de prevención contra caídas</h3>
        <div>
          {[
            { key: "procedimiento_charla", label: "Procedimiento de trabajo seguro divulgado en charla preoperacional" },
            { key: "medidas_colectivas_prevencion", label: "Medidas colectivas de prevención (información y demarcación de la zona de peligro)" },
            { key: "epp_epcc_inspeccion", label: "EPP y EPCC en buen estado en inspección pre uso" },
            { key: "equipos_herramientas_inspeccion", label: "Equipos y herramientas en buen estado en inspección pre uso" },
            { key: "inspeccion_sistema_ta", label: "Inspección previa del sistema para TA" },
            { key: "plan_emergencias_rescate", label: "Se establece plan de emergencias y plan de rescate" },
            { key: "medidas_caida_objetos", label: "Medidas para evitar la caída de objetos (Rodapié, bolsos porta herramientas)" },
            { key: "kit_rescate", label: "¿Se cuenta en sitio con Kit de Rescate?" },
            { key: "permiso_trabajo_ats", label: "Permiso de trabajo en alturas, listas de chequeo, Análisis de Trabajo Seguro (ATS)" },
            { key: "verificacion_atmosfericas", label: "Verificación continua de las condiciones atmosféricas (viento, lluvia, etc.)" },
          ].map((item) => (
            <div key={item.key}>
              <span>{item.label}</span>
              <select
                name={item.key}
                value={precaucionesGenerales[item.key]}
                onChange={handlePrecaucionesChange}
              >
                <option value="">--</option>
                <option value="SI">SI</option>
                <option value="NO">NO</option>
                <option value="NA">NA</option>
              </select>
            </div>
          ))}
        </div>
        <div>
          <div>
            Se calculó la distancia vertical requerida por un trabajador en caso de una caída, para evitar
            que este impacte contra el suelo o contra un obstáculo, teniendo en cuenta principalmente la
            configuración del sistema de protección contra caídas utilizado (requerimiento de claridad).
          </div>
          <select
            name="distancia_vertical_caida"
            value={precaucionesGenerales.distancia_vertical_caida}
            onChange={handlePrecaucionesChange}
          >
            <option value="">--</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
            <option value="NA">NA</option>
          </select>
        </div>
        <div>
          <label>Otro (cual):</label>
          <input
            type="text"
            name="otro"
            value={precaucionesGenerales.otro}
            onChange={handlePrecaucionesChange}
          />
        </div>
      </div>

      <div className="card-section">
        <h3 className="card-title">Equipos / Sistema de acceso para trabajo en alturas</h3>
        <div className="sub-card-section" style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: 0, marginBottom: 10 }}>Escaleras</h4>
          <table style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td>Vertical fija</td>
                <td colSpan={3}>
                  <select
                    name="vertical_fija"
                    value={equiposAccesoP8.vertical_fija}
                    onChange={handleEquiposAccesoP8Change}
                    style={{ width: "100%" }}
                  >
                    <option value="">--</option>
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                    <option value="NA">NA</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Vertical Portatil</td>
                <td colSpan={3}>
                  <select
                    name="vertical_portatil"
                    value={equiposAccesoP8.vertical_portatil}
                    onChange={handleEquiposAccesoP8Change}
                    style={{ width: "100%" }}
                  >
                    <option value="">--</option>
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                    <option value="NA">NA</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="sub-card-section" style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: 0, marginBottom: 10 }}>Andamios</h4>
          <table style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td>Multidireccional</td>
                <td colSpan={3}>
                  <select
                    name="andamio_multidireccional"
                    value={equiposAccesoP8.andamio_multidireccional}
                    onChange={handleEquiposAccesoP8Change}
                    style={{ width: "100%" }}
                  >
                    <option value="">--</option>
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                    <option value="NA">NA</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Colgante</td>
                <td colSpan={3}>
                  <select
                    name="andamio_colgante"
                    value={equiposAccesoP8.andamio_colgante}
                    onChange={handleEquiposAccesoP8Change}
                    style={{ width: "100%" }}
                  >
                    <option value="">--</option>
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                    <option value="NA">NA</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="sub-card-section" style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: 0, marginBottom: 10 }}>Equipos elevadores</h4>
          <table style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td>Elevadores de carga</td>
                <td colSpan={3}>
                  <select
                    name="elevador_carga"
                    value={equiposAccesoP8.elevador_carga}
                    onChange={handleEquiposAccesoP8Change}
                    style={{ width: "100%" }}
                  >
                    <option value="">--</option>
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                    <option value="NA">NA</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Canastilla</td>
                <td colSpan={3}>
                  <select
                    name="canastilla"
                    value={equiposAccesoP8.canastilla}
                    onChange={handleEquiposAccesoP8Change}
                    style={{ width: "100%" }}
                  >
                    <option value="">--</option>
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                    <option value="NA">NA</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Ascensores personas</td>
                <td colSpan={3}>
                  <select
                    name="ascensor_personas"
                    value={equiposAccesoP8.ascensor_personas}
                    onChange={handleEquiposAccesoP8Change}
                    style={{ width: "100%" }}
                  >
                    <option value="">--</option>
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                    <option value="NA">NA</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Acceso por cuerdas:</label>
          <select
            name="acceso_cuerdas"
            value={equiposAccesoP8.acceso_cuerdas}
            onChange={handleEquiposAccesoP8Change}
            style={{ width: "97%" }}
          >
            <option value="">--</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
            <option value="NA">NA</option>
          </select>
        </div>
        <div>
          <label>otro (cual):</label>
          <input
            type="text"
            name="otro"
            value={equiposAccesoP8.otro}
            onChange={handleEquiposAccesoP8Change}
            style={{ width: "91%" }}
          />
        </div>
      </div>

      <div className="card-section">
        <h3 className="card-title">VALIDACION DEL PERMISO DE TRABAJO</h3>
        <div>
          -Resolución 4272 de 2021, Artículo 15: Permiso de trabajo en alturas. Mecanismo administrativo
          que, mediante la verificación y control previo de todos los aspectos relacionados en la presente
          resolución, tiene como objeto fomentar la prevención durante la realización de trabajos en alturas.
          <br /><br />
          -Este permiso de trabajo en alturas debe ser diligenciado, por el(los) trabajador(es) o por el
          empleador y debe ser revisado y suscrito por el coordinador de trabajo en alturas en cada evento.
          Siempre que un trabajador ingrese a una zona de peligro, debe contar con la debida autorización y
          si requiere exponerse al riesgo de caídas, debe contar con un aval a través de un permiso de
          trabajo en alturas acompañado de una lista de chequeo, más aún en caso de que no haya barandas,
          sistemas de control de acceso, demarcación o sistemas de barreras físicas que cumplan con las
          especificaciones descritas en la presente resolución.
          <br /><br />
          - Las listas de chequeo contenidas en este permiso así como sus anexos aplicables deben ser
          verificadas a diario y antes de iniciar la actividad objeto de este permiso
          <br /><br />
          - Este permiso pierde su validez en el momento en que alguna de las condiciones iniciales sufra
          algún cambio
        </div>
      </div>

      <div>
        <label>Observaciones</label>
        <textarea
          placeholder="Ingrese observaciones adicionales aquí"
          value={generales.observaciones || ""}
          onChange={(e) => setGenerales({ ...generales, observaciones: e.target.value })}
        />
      </div>

      <div>
        <button type="button" onClick={() => setModalCierreOpen(true)}>
          11. CIERRE PERMISO DE TA POR SUSPENSIÓN DEL TRABAJO
        </button>
        <button type="button" onClick={() => setModalCierreLaborOpen(true)}>
          12. CIERRE PERMISO DE TA POR LABOR TERMINADA
        </button>
      </div>

      {modalCierreOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.35)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            padding: 28, minWidth: 320, maxWidth: 420, width: "90%",
          }}>
            <div style={{ fontWeight: 700, fontSize: "1.08rem", marginBottom: 16 }}>
              11. CIERRE PERMISO DE TA POR SUSPENSIÓN DEL TRABAJO
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Motivo</label>
              <input
                type="text"
                name="motivo"
                value={cierrePermiso.motivo}
                onChange={handleCierrePermisoChange}
                placeholder="Motivo de la suspensión"
                disabled={cierrePermisoGuardado}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>
                Nombre y apellidos de quien suspende el trabajo
              </label>
              <input
                type="text"
                name="nombre"
                value={cierrePermiso.nombre}
                onChange={handleCierrePermisoChange}
                placeholder="Nombre y apellidos"
                disabled={cierrePermisoGuardado}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => setModalCierreOpen(false)}>Cerrar</button>
              <button
                type="button"
                disabled={cierrePermisoGuardado}
                onClick={() => setCierrePermisoGuardado(true)}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalCierreLaborOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.35)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            padding: 28, minWidth: 340, maxWidth: 700, width: "95%",
          }}>
            <div style={{ fontWeight: 700, fontSize: "1.08rem", marginBottom: 16 }}>
              12. CIERRE PERMISO DE TA POR LABOR TERMINADA
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  Trabajador autorizado responsable de la actividad
                </div>
                <textarea
                  name="trabajador_nombre"
                  value={cierreLabor.trabajador_nombre}
                  onChange={handleCierreLaborChange}
                  style={{ width: "100%", minHeight: 32, marginBottom: 8, borderRadius: 4, border: "1px solid #bdbdbd", padding: 6 }}
                  placeholder="Nombre y apellidos"
                  disabled={cierreLaborGuardado}
                />
                <div style={{ fontSize: "0.95rem", color: "#444", marginTop: 6 }}>
                  Personalmente he verificado que: el área queda limpia y sin residuos, no se han
                  presentado accidentes y/o incidentes, las condiciones de seguridad declaradas se
                  cumplieron a cabalidad.
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  Coordinador Trabajo seguro en alturas
                </div>
                <textarea
                  name="coordinador_nombre"
                  value={cierreLabor.coordinador_nombre}
                  onChange={handleCierreLaborChange}
                  style={{ width: "100%", minHeight: 32, marginBottom: 8, borderRadius: 4, border: "1px solid #bdbdbd", padding: 6 }}
                  placeholder="Nombre y apellidos"
                  disabled={cierreLaborGuardado}
                />
                <div style={{ fontSize: "0.95rem", color: "#444", marginTop: 6 }}>
                  Personalmente declaro que: *El trabajo ha sido terminado. *El sitio queda en
                  condiciones seguras. *Entrego el área limpia y libre de residuos de materiales y
                  concreto. *Los equipos de elevación se encuentran en buenas condiciones de operación.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button type="button" onClick={() => setModalCierreLaborOpen(false)}>Cerrar</button>
              <button
                type="button"
                disabled={cierreLaborGuardado}
                onClick={() => setCierreLaborGuardado(true)}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card-section">
        <h3 className="card-title">Firmas / Validación</h3>
      </div>

      <button onClick={handleGuardar}>Guardar</button>
    </div>
  );
}

export default PermisoTrabajo;