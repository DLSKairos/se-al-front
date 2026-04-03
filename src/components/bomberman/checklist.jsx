import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/** Mapea cada campo de BD al rol del trabajador que debe completarlo: "operario" | "auxiliar" | "ambos" */
const ITEM_ROLES = {
  // Card RADIO/BOTIQUÍN/KIT/ARNÉS/ESLINGA - ambos
  radio_marca_serial_estado: "ambos", radio_estado: "ambos", verificacion_botiquin: "ambos",
  kit_antiderrames: "ambos", arnes_marca_serial_fecha_estado: "ambos", eslinga_marca_serial_fecha_estado: "ambos",
  // Operario: CHASIS
  chasis_aceite_motor: "operario", chasis_nivel_combustible: "operario", chasis_nivel_refrigerante: "operario",
  chasis_presion_llantas: "operario", chasis_fugas: "operario", chasis_soldadura: "operario",
  chasis_integridad_cubierta: "operario", chasis_herramientas_productos_diversos: "operario",
  chasis_sistema_alberca: "operario", chasis_nivel_agua: "operario",
  combustible_pimpinas: "operario", ultima_fecha_lavado_tanque: "operario",
  aceite_hidrolavadora: "operario", sensor_motor_aspas: "operario",
  filtro_hidraulico_equipo: "operario", filtro_primario_combustible: "operario",
  filtro_aire: "operario", drenaje_filtro_combustible: "operario", filtro_hidraulico_limalla: "operario",
  // Operario: PIEZAS DE DESGASTE
  anillos: "operario", placa_gafa: "operario", cilindros_atornillados: "operario",
  partes_faltantes: "operario", mecanismo_s: "operario", estado_oring: "operario",
  funcion_vibrador: "operario", paletas_eje_agitador: "operario", motor_accionamiento: "operario",
  valvula_control: "operario",
  pistones_paso_masilla: "operario", pistones_paso_agua: "operario",
  partes_faltantes_nuevo: "operario", caja_agua_condiciones: "operario",
  mecanismo_tubo_s: "operario", rejilla_tolva_sensor: "operario",
  mangueras_tubos_hidraulicos: "operario", caja_agua: "operario", rejilla_tolva: "operario",
  // Operario: SISTEMA DE LUBRICACIÓN
  superficie_nivel_deposito_grasa: "operario", superficie_puntos_lubricacion: "operario",
  superficie_empaquetaduras_conexion: "operario", superficie_nivel_agua_lubricacion: "operario",
  dias_grasa: "operario", punto_engrase_tapado: "operario", ultima_fecha_mantenimiento_salida: "operario",
  // Auxiliar: SISTEMA HIDRÁULICO
  hidraulico_fugas: "auxiliar", hidraulico_cilindros_botellas_estado: "auxiliar",
  hidraulico_indicador_nivel_aceite: "auxiliar", hidraulico_enfriador_termotasto: "auxiliar",
  hidraulico_indicador_filtro: "auxiliar", hidraulico_mangueras_tubos_sin_fugas: "auxiliar",
  // Auxiliar: MANGUERAS
  mangueras_interna_no_deshilachadas: "auxiliar", mangueras_acoples_buen_estado: "auxiliar",
  mangueras_externa_no_deshilachado: "auxiliar",
  mangueras_3_pulgadas: "auxiliar", mangueras_4_pulgadas: "auxiliar", mangueras_5_pulgadas: "auxiliar",
  mangueras_sin_acoples: "auxiliar",
  // Auxiliar: SISTEMA ELÉCTRICO
  electrico_interruptores_buen_estado: "auxiliar", electrico_luces_funcionan: "auxiliar",
  electrico_cubiertas_proteccion_buenas: "auxiliar", electrico_cordon_mando_buen_estado: "auxiliar",
  electrico_interruptores_emergencia_funcionan: "auxiliar", electrico_conexiones_sin_oxido: "auxiliar",
  electrico_paros_emergencia: "auxiliar", electrico_aisladores_cables_buenos: "auxiliar",
  cables_solenoide: "auxiliar",
  // Auxiliar: TUBERÍA
  tuberia_abrazaderas_codos_ajustadas: "auxiliar", tuberia_bujia_tallo_anclados: "auxiliar",
  tuberia_abrazaderas_descarga_ajustadas: "auxiliar", tuberia_espesor: "auxiliar",
  tuberia_vertical_tallo_recta: "auxiliar", tuberia_desplazamiento_seguro: "auxiliar",
  codo_abrazadera_salida: "auxiliar", limpieza_abrazaderas_empaques: "auxiliar",
  estado_abrazaderas_empaques: "auxiliar", numero_piso_fundiendo: "auxiliar",
  cantidad_puntos_anclaje: "auxiliar", ultima_fecha_medicion_espesores: "auxiliar",
  vertical_tallo_recta: "auxiliar"
};

const ITEM_FIELDS = [
  "radio_marca_serial_estado", "radio_estado", "verificacion_botiquin", "kit_antiderrames",
  "arnes_marca_serial_fecha_estado", "eslinga_marca_serial_fecha_estado",
  "chasis_aceite_motor", "chasis_nivel_combustible", "chasis_nivel_refrigerante",
  "chasis_presion_llantas", "chasis_fugas", "chasis_soldadura", "chasis_integridad_cubierta",
  "chasis_herramientas_productos_diversos", "chasis_sistema_alberca", "chasis_nivel_agua",
  "combustible_pimpinas", "ultima_fecha_lavado_tanque", "aceite_hidrolavadora", "sensor_motor_aspas",
  "filtro_hidraulico_equipo", "filtro_primario_combustible", "filtro_aire",
  "drenaje_filtro_combustible", "filtro_hidraulico_limalla",
  "anillos", "placa_gafa", "cilindros_atornillados", "partes_faltantes", "mecanismo_s",
  "estado_oring", "funcion_vibrador", "paletas_eje_agitador", "motor_accionamiento", "valvula_control",
  "pistones_paso_masilla", "pistones_paso_agua", "partes_faltantes_nuevo", "caja_agua_condiciones",
  "mecanismo_tubo_s", "rejilla_tolva_sensor",
  "mangueras_tubos_hidraulicos", "caja_agua", "rejilla_tolva", "superficie_nivel_agua_lubricacion",
  "hidraulico_fugas", "hidraulico_cilindros_botellas_estado", "hidraulico_indicador_nivel_aceite",
  "hidraulico_enfriador_termotasto", "hidraulico_indicador_filtro", "hidraulico_mangueras_tubos_sin_fugas",
  "superficie_nivel_deposito_grasa", "superficie_puntos_lubricacion", "superficie_empaquetaduras_conexion",
  "dias_grasa", "punto_engrase_tapado", "ultima_fecha_mantenimiento_salida",
  "mangueras_interna_no_deshilachadas", "mangueras_acoples_buen_estado", "mangueras_externa_no_deshilachado",
  "mangueras_3_pulgadas", "mangueras_4_pulgadas", "mangueras_5_pulgadas", "mangueras_sin_acoples",
  "electrico_interruptores_buen_estado", "electrico_luces_funcionan", "electrico_cubiertas_proteccion_buenas",
  "electrico_cordon_mando_buen_estado", "electrico_interruptores_emergencia_funcionan", "electrico_conexiones_sin_oxido",
  "electrico_paros_emergencia", "electrico_aisladores_cables_buenos", "cables_solenoide",
  "tuberia_abrazaderas_codos_ajustadas", "tuberia_bujia_tallo_anclados", "tuberia_abrazaderas_descarga_ajustadas",
  "tuberia_espesor", "tuberia_vertical_tallo_recta", "tuberia_desplazamiento_seguro",
  "codo_abrazadera_salida", "limpieza_abrazaderas_empaques", "estado_abrazaderas_empaques",
  "numero_piso_fundiendo", "cantidad_puntos_anclaje", "ultima_fecha_medicion_espesores", "vertical_tallo_recta"
];

/** Campos almacenados en el estado datos en lugar de estadoItems */
const CAMPOS_EN_DATOS = {
  radio_marca_serial_estado: "text", arnes_marca_serial_fecha_estado: "text", eslinga_marca_serial_fecha_estado: "text",
  combustible_pimpinas: "number", ultima_fecha_lavado_tanque: "date", punto_engrase_tapado: "text",
  ultima_fecha_mantenimiento_salida: "date", dias_grasa: "number",
  mangueras_3_pulgadas: "number", mangueras_4_pulgadas: "number", mangueras_5_pulgadas: "number",
  mangueras_sin_acoples: "text", numero_piso_fundiendo: "number", cantidad_puntos_anclaje: "number",
  ultima_fecha_medicion_espesores: "date"
};

/** Campos que usan conjuntos de opciones personalizados en lugar del grupo de radio BUENO/REGULAR/MALO por defecto */
const FIELD_OPTIONS = {
  radio_estado: ["BUENO", "MALO"], verificacion_botiquin: ["BUENO", "MALO"], kit_antiderrames: ["BUENO", "MALO"],
  aceite_hidrolavadora: ["BUENO", "EMULSIONADO"], sensor_motor_aspas: ["SI", "NO"],
  filtro_hidraulico_equipo: ["BUENO", "MALO"], filtro_primario_combustible: ["LIMPIO", "NO_LIMPIO"],
  filtro_aire: ["BUENO", "MALO"], drenaje_filtro_combustible: ["REALIZADO", "NO_REALIZADO"],
  filtro_hidraulico_limalla: ["BUENO", "MALO"], pistones_paso_masilla: ["BUENO", "MALO"],
  pistones_paso_agua: ["BUENO", "MALO"], partes_faltantes_nuevo: ["SI_FALTAN", "NO_FALTAN"],
  caja_agua_condiciones: ["CUMPLE", "NO_CUMPLE"], mecanismo_tubo_s: ["SI", "NO"],
  rejilla_tolva_sensor: ["BUENO", "MALO"], cables_solenoide: ["BUENO", "MALO"],
  codo_abrazadera_salida: ["BUENO", "MALO"], limpieza_abrazaderas_empaques: ["BUENO", "MALO"],
  estado_abrazaderas_empaques: ["BUENO", "MALO"], vertical_tallo_recta: ["SI", "NO"]
};

const FIELD_TO_TEXT = {
  radio_marca_serial_estado: "Indique marca, serial y estado del radio.",
  radio_estado: "Estado del radio.",
  verificacion_botiquin: "Realice verificación y estado de los elementos de botiquín.",
  kit_antiderrames: "Realice verificación de KIT antiderrames.",
  arnes_marca_serial_fecha_estado: "Indique marca, serial, fecha de inspección y estado de arnés.",
  eslinga_marca_serial_fecha_estado: "Indique marca, serial, fecha de inspección y estado de eslinga.",
  chasis_aceite_motor: "Revisar el nivel y estado de aceite del motor.",
  chasis_nivel_combustible: "Indique la cantidad de combustible en el tanque.",
  chasis_nivel_refrigerante: "Revise el nivel del refrigerante.",
  chasis_presion_llantas: "Revise la condición y la presión de las llantas.",
  chasis_fugas: "Revise las fugas de combustible, aceite y otras fugas.",
  chasis_soldadura: "Revise el sub-chasis para detectar grietas de soldadura, pernos faltantes, deformaciones.",
  chasis_integridad_cubierta: "Revise la integridad estructural de la cubierta.",
  chasis_herramientas_productos_diversos: "Revise que las cajas de herramientas y productos diversos estén aseguradas.",
  chasis_sistema_alberca: "Revise sistema de drenaje de la alberca.",
  chasis_nivel_agua: "Revisar el nivel del agua que se encuentre lleno.",
  combustible_pimpinas: "Indique la cantidad de combustible en pimpinas.",
  ultima_fecha_lavado_tanque: "Última fecha de lavado de tanque de combustible.",
  aceite_hidrolavadora: "Revise el nivel del aceite de la hidrolavadora.",
  sensor_motor_aspas: "Revise si cuenta con el sensor bueno del motor de aspas.",
  filtro_hidraulico_equipo: "Revisión del filtro hidráulico del equipo.",
  filtro_primario_combustible: "Revisión del filtro primario de combustible debe encontrarse limpio.",
  filtro_aire: "Revise y realice limpieza del filtro de aire.",
  drenaje_filtro_combustible: "Realice drenaje de filtro de combustible.",
  filtro_hidraulico_limalla: "Revisar que el filtro hidráulico no tenga limalla.",
  anillos: "Revise anillo de corte y anillo de sujeción.",
  placa_gafa: "Revise placa gafa.",
  cilindros_atornillados: "Revisar que los cilindros de empuje o camisas de concreto estén asegurados y bien atornillados.",
  partes_faltantes: "Revisar si hay partes faltantes tales como pasadores, pernos y tuercas.",
  mecanismo_s: "Revise que el mecanismo de cambio del tubo en \"S\" sea estructuralmente rígido.",
  estado_oring: "Revise el estado del oring de la escotilla.",
  funcion_vibrador: "Revisar que el vibrador esté montado en forma segura y que las conexiones de los cables estén aseguradas y este funcionando correctamente.",
  paletas_eje_agitador: "Revise que las paletas y el eje del agitador no estén dañados y revise si hay soldaduras agrietadas.",
  motor_accionamiento: "Revise si el motor de accionamiento está asegurado y si los cojinetes, sellos y caja están en buenas condiciones.",
  valvula_control: "Revise que la válvula de control esté montada en forma segura y que las palancas se muevan libremente.",
  pistones_paso_masilla: "Revise los pistones y asegure que no exista paso de masilla para la caja de refrigeración.",
  pistones_paso_agua: "Revise los pistones y asegure que no exista paso de agua a la tolva.",
  partes_faltantes_nuevo: "Revisar si hay partes faltantes tales como pasadores, pernos y tuercas.",
  caja_agua_condiciones: "Revise que la caja de agua sea estructuralmente rígida, esté limpia, con la cubierta en su lugar y que el drenaje sea funcional.",
  mecanismo_tubo_s: "Revise que el mecanismo de cambio del tubo en \"S\" sea estructuralmente rígido.",
  rejilla_tolva_sensor: "Revisar que la rejilla de la tolva no esté partida y que esté funcionando el sensor.",
  hidraulico_fugas: "Revisar que no existan fugas hidráulicas, estrangule la máquina antes de iniciar el servicio.",
  hidraulico_cilindros_botellas_estado: "Revisar si los cilindros hidráulicos o botellas impulsadoras estén asegurados y en buenas condiciones.",
  hidraulico_indicador_nivel_aceite: "Revise el nivel del aceite de la hidrolavadora.",
  hidraulico_enfriador_termotasto: "Revise enfriador aceite hidráulico y su termostato.",
  hidraulico_indicador_filtro: "Revisión del filtro hidráulico del equipo.",
  hidraulico_mangueras_tubos_sin_fugas: "Revise que las mangueras y tubos hidráulicos estén asegurados, sin fugas y con mínimo desgaste.",
  superficie_nivel_deposito_grasa: "Revise el nivel del depósito de grasa.",
  superficie_puntos_lubricacion: "Revise puntos de lubricación.",
  superficie_empaquetaduras_conexion: "Revise empaquetaduras de conexión del tubo en \"S\" y sellos de salida.",
  mangueras_interna_no_deshilachadas: "Revisión interna que la manguera no se encuentre deshilachada.",
  mangueras_acoples_buen_estado: "Revisión de acoples que se encuentren en buen estado.",
  mangueras_externa_no_deshilachado: "Revisión externa de que la manguera no esté deshilachada.",
  electrico_interruptores_buen_estado: "Revisar que los interruptores estén en buenas condiciones.",
  electrico_luces_funcionan: "Revisar que los instrumentos e indicadores y las luces funcionen.",
  electrico_cubiertas_proteccion_buenas: "Revisar que las cubiertas de caucho de protección estén en buenas condiciones.",
  electrico_cordon_mando_buen_estado: "Revisar que el cordón de mando esté en buenas condiciones.",
  electrico_interruptores_emergencia_funcionan: "Revise las funciones de los interruptores de parada de emergencia.",
  electrico_conexiones_sin_oxido: "Revisar que las conexiones eléctricas estén bien aseguradas y libres de óxido.",
  electrico_paros_emergencia: "Revisar paros de emergencia.",
  electrico_aisladores_cables_buenos: "Revisar que los aisladores de los cables no estén desgastados.",
  tuberia_abrazaderas_codos_ajustadas: "Revisar que el codo de salida esté asegurado y que la abrazadera esté fija.",
  tuberia_bujia_tallo_anclados: "Colocación de tubería y tallo (bien anclada a la estructura).",
  tuberia_abrazaderas_descarga_ajustadas: "Revise si las abrazaderas de los tubos de descarga están flojas o dañadas.",
  tuberia_espesor: "Revise espesores de tubería.",
  tuberia_vertical_tallo_recta: "Revise que la vertical o tallo se encuentre recta.",
  tuberia_desplazamiento_seguro: "Revisar el área de desplazamiento de la tubería y que sea segura para su manipulación.",
  mangueras_tubos_hidraulicos: "Revise la condición de las mangueras y tubos hidráulicos.",
  caja_agua: "Revise que la caja de agua sea estructuralmente rígida, esté limpia y el drenaje funcional.",
  rejilla_tolva: "Revisar que la rejilla de la tolva no esté partida y que funcione el sensor.",
  superficie_nivel_agua_lubricacion: "Revise el nivel de agua de caja de lubricación de los pistones.",
  dias_grasa: "Indique para cuántos días le queda grasa.",
  punto_engrase_tapado: "Indique qué punto de engrase está tapado.",
  ultima_fecha_mantenimiento_salida: "Indique última fecha de mantenimiento de salida.",
  mangueras_3_pulgadas: "Informe cuántas mangueras de 3\" tiene en obra.",
  mangueras_4_pulgadas: "Informe cuántas mangueras de 4\" tiene en obra.",
  mangueras_5_pulgadas: "Informe cuántas mangueras de 5\" tiene en obra.",
  mangueras_sin_acoples: "¿Cuál de las mangueras no tiene acoples?",
  cables_solenoide: "Revisar cables de la solenoide.",
  codo_abrazadera_salida: "Indique el estado del codo de salida y la abrazadera de salida.",
  limpieza_abrazaderas_empaques: "Reporte de limpieza de abrazaderas y empaques.",
  estado_abrazaderas_empaques: "Estado de abrazaderas y empaques.",
  numero_piso_fundiendo: "Indique en qué número de piso está fundiendo.",
  cantidad_puntos_anclaje: "Indique cuántos puntos de anclaje tiene.",
  ultima_fecha_medicion_espesores: "Última fecha de medición de espesores de tubería.",
  vertical_tallo_recta: "Revise que la vertical o tallo se encuentre recta."
};

/** Secciones del checklist con arrays de campos explícitos para garantizar alineación con las columnas de BD */
const SECCIONES = [
  { titulo: "RADIO, BOTIQUÍN, KIT ANTIDERRAMES, ARNÉS Y ESLINGA", fields: ITEM_FIELDS.slice(0, 6) },
  { titulo: "CHASIS", fields: ITEM_FIELDS.slice(6, 25) },
  {
    titulo: "PIEZAS DE DESGASTE Y SALIENTES",
    fields: [
      ...ITEM_FIELDS.slice(25, 41),
      "mangueras_tubos_hidraulicos", "caja_agua", "rejilla_tolva"
    ]
  },
  {
    titulo: "SISTEMA HIDRÁULICO",
    fields: [
      "hidraulico_fugas", "hidraulico_cilindros_botellas_estado", "hidraulico_indicador_nivel_aceite",
      "hidraulico_enfriador_termotasto", "hidraulico_indicador_filtro", "hidraulico_mangueras_tubos_sin_fugas"
    ]
  },
  {
    titulo: "SISTEMA DE LUBRICACIÓN",
    fields: [
      "superficie_nivel_agua_lubricacion", "superficie_nivel_deposito_grasa", "superficie_puntos_lubricacion",
      "superficie_empaquetaduras_conexion", "dias_grasa", "punto_engrase_tapado", "ultima_fecha_mantenimiento_salida"
    ]
  },
  { titulo: "MANGUERAS Y ACOPLES", fields: ITEM_FIELDS.slice(57, 64) },
  { titulo: "SISTEMA ELÉCTRICO", fields: ITEM_FIELDS.slice(64, 73) },
  { titulo: "TUBERÍA", fields: ITEM_FIELDS.slice(73) }
];

function detectarCargo() {
  let cargoRaw = (localStorage.getItem("cargo_trabajador") || "").trim();
  if (!cargoRaw) {
    try {
      const usuario = localStorage.getItem("usuario");
      if (usuario) {
        const u = JSON.parse(usuario);
        cargoRaw = (u.cargo || u.cargo_trabajador || u.puesto || "").trim();
      }
    } catch (_e) {
      /* ignorar */
    }
  }
  const c = cargoRaw.toLowerCase();
  if (c.includes("auxiliar") || c.includes("auxliar") || c.includes("ayudante") || c.includes("asistente")) return "auxiliar";
  if (c.includes("operario") || c.includes("operador")) return "operario";
  return null;
}

function campoVisibleParaCargo(field, cargo) {
  if (!cargo) return true;
  const rol = ITEM_ROLES[field];
  if (!rol) return false;
  if (rol === "ambos") return true;
  return rol === cargo;
}

/**
 * Checklist — formulario de inspección pre-operacional para bomba de concreto estacionaria (CIFA / TURBOSOL).
 * Filtra los campos visibles según el cargo del trabajador (operario vs. auxiliar) leído desde localStorage.
 * Persiste las respuestas semanalmente y envía mediante POST a /bomberman/checklist al guardar.
 */
function Checklist() {
  const navigate = useNavigate();
  const [camposFaltantes, setCamposFaltantes] = useState([]);
  const itemRefs = useRef({});
  const submitRef = useRef(null);
  const bombaRef = useRef(null);
  const horometroRef = useRef(null);

  const cargo = detectarCargo();
  const nombre_operador_local = localStorage.getItem("nombre_trabajador") || "";
  const nombre_obra_local = localStorage.getItem("obra") || "";

  const [datos, setDatos] = useState(() => {
    const base = {
      nombre_cliente: "", nombre_proyecto: "", fecha_servicio: "", bomba_numero: "", horometro_motor: "",
      nombre_operador: "", observaciones: "", empresa_id: null
    };
    Object.keys(CAMPOS_EN_DATOS).forEach((k) => { base[k] = ""; });
    return base;
  });

  const [lista_bombas, set_lista_bombas] = useState([]);
  const [estadoItems, setEstadoItems] = useState({});
  const [enviando, setEnviando] = useState(false);

  const itemToFieldFiltered = ITEM_FIELDS.filter(f => campoVisibleParaCargo(f, cargo));

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

  useEffect(() => {
    const inicial = ITEM_FIELDS.filter((f) => !(f in CAMPOS_EN_DATOS)).reduce((acc, field) => {
      acc[field] = { estado: "", observacion: "" };
      return acc;
    }, {});
    setEstadoItems(inicial);
  }, []);

  useEffect(() => {
    const fecha_hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
    let empresa_id = null;
    try {
      const usuario = localStorage.getItem("usuario");
      if (usuario) {
        const u = JSON.parse(usuario);
        empresa_id = u.empresa_id ?? u.empresaId ?? null;
      }
    } catch {}

    axios
      .get(`${API_BASE_URL}/obras`)
      .then((res) => {
        const obras = Array.isArray(res.data.obras) ? res.data.obras : res.data || [];
        const obra_encontrada = obras.find((o) => o.nombre_obra === nombre_obra_local);
        const constructora = obra_encontrada ? obra_encontrada.constructora : "";
        setDatos((prev) => ({
          ...prev,
          nombre_cliente: constructora,
          nombre_proyecto: nombre_obra_local,
          fecha_servicio: fecha_hoy,
          nombre_operador: nombre_operador_local,
          empresa_id: empresa_id ?? prev.empresa_id
        }));
      })
      .catch(() => {
        setDatos((prev) => ({
          ...prev,
          nombre_cliente: "",
          nombre_proyecto: nombre_obra_local,
          fecha_servicio: fecha_hoy,
          nombre_operador: nombre_operador_local,
          empresa_id: empresa_id ?? prev.empresa_id
        }));
      });
  }, [nombre_operador_local, nombre_obra_local]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/bombas`)
      .then((res) => {
        const bombas = Array.isArray(res.data.bombas) ? res.data.bombas : res.data || [];
        set_lista_bombas(bombas);
      })
      .catch(() => set_lista_bombas([]));
  }, []);

  useEffect(() => {
    const weekKey = getCurrentWeekKey();
    const saved = localStorage.getItem("bomberman_checklist_respuestas");
    let shouldClear = false;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isSunday() || parsed.weekKey !== weekKey) {
          shouldClear = true;
        } else {
          setDatos((prev) => ({ ...prev, ...(parsed.datos || {}) }));
          const loaded = parsed.estadoItems || {};
          setEstadoItems((prev) => {
            const next = { ...prev };
            ITEM_FIELDS.forEach((f) => {
              if (!(f in CAMPOS_EN_DATOS) && loaded[f]) next[f] = loaded[f];
            });
            return next;
          });
        }
      } catch {
        shouldClear = true;
      }
    }
    if (shouldClear) {
      localStorage.removeItem("bomberman_checklist_respuestas");
      setEstadoItems(ITEM_FIELDS.filter((f) => !(f in CAMPOS_EN_DATOS)).reduce((acc, f) => {
        acc[f] = { estado: "", observacion: "" };
        return acc;
      }, {}));
    }
  }, []);

  const handle_change = (e) => {
    const { name, value } = e.target;
    if (name === "bomba_numero" || name === "horometro_motor") {
      setCamposFaltantes((prev) => prev.filter((f) => f !== name));
    }
    setDatos((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemStateChange = (fieldName, nuevoEstado) => {
    setCamposFaltantes((prev) => prev.filter((f) => f !== fieldName));
    const opts = FIELD_OPTIONS[fieldName];
    const isGood = opts ? opts[0] === nuevoEstado : (nuevoEstado === "BUENO" || nuevoEstado === "");
    setEstadoItems((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        estado: nuevoEstado,
        observacion: isGood ? "" : prev[fieldName].observacion
      }
    }));
  };

  const handleItemObservationChange = (fieldName, nuevaObservacion) => {
    setCamposFaltantes((prev) => prev.filter((f) => f !== `${fieldName}_observacion`));
    setEstadoItems((prev) => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], observacion: nuevaObservacion }
    }));
  };

  const scrollToFirstError = (errores) => {
    if (errores.length === 0) return;
    const primerError = errores[0];
    let elemento =
      primerError === "bomba_numero"
        ? bombaRef.current
        : primerError === "horometro_motor"
          ? horometroRef.current
          : itemRefs.current[primerError];
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "start" });
      elemento.focus?.();
    }
  };

  const scrollToBottom = () => {
    submitRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    submitRef.current?.focus?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setEnviando(true);
      setCamposFaltantes([]);

      const headerErrores = [];
      if (!datos.bomba_numero) headerErrores.push("bomba_numero");
      if (!datos.horometro_motor) headerErrores.push("horometro_motor");

      const erroresDetectados = [];
      itemToFieldFiltered.forEach((field) => {
        if (field in CAMPOS_EN_DATOS) return;
        if ((estadoItems[field]?.estado ?? "") === "") {
          erroresDetectados.push(field);
        }
      });
      itemToFieldFiltered.forEach((field) => {
        if (field in CAMPOS_EN_DATOS) return;
        const estado = estadoItems[field]?.estado ?? "";
        const obs = (estadoItems[field]?.observacion ?? "").trim();
        const opts = FIELD_OPTIONS[field];
        const requiereObs = opts ? (opts.indexOf(estado) > 0) : (estado === "REGULAR" || estado === "MALO");
        if (requiereObs && obs === "") {
          erroresDetectados.push(`${field}_observacion`);
        }
      });

      const todosLosErrores = [...headerErrores, ...erroresDetectados];
      if (todosLosErrores.length > 0) {
        setCamposFaltantes(todosLosErrores);
        scrollToFirstError(todosLosErrores);
        alert("Por favor complete todos los campos obligatorios. Revise los campos marcados en rojo.");
        return;
      }

      const checklistPayload = {};
      ITEM_FIELDS.forEach((field) => {
        if (field in CAMPOS_EN_DATOS) {
          const v = datos[field];
          const tipo = CAMPOS_EN_DATOS[field];
          const vacio = v === undefined || v === null || v === "";
          if (tipo === "number") {
            const n = Number(v);
            checklistPayload[field] = vacio ? null : (isNaN(n) ? null : n);
          } else if (tipo === "date") {
            checklistPayload[field] = vacio ? null : (v || null);
          } else {
            checklistPayload[field] = vacio ? "" : v;
          }
        } else {
          const est = estadoItems[field]?.estado ?? "";
          const obs = (estadoItems[field]?.observacion ?? "").trim();
          checklistPayload[field] = est || "BUENO";
          checklistPayload[`${field}_observacion`] = obs;
        }
      });

      const payload = {
        nombre_cliente: datos.nombre_cliente || "Sin registrar",
        nombre_proyecto: datos.nombre_proyecto || "Sin registrar",
        fecha_servicio: datos.fecha_servicio || "",
        nombre_operador: datos.nombre_operador || "",
        bomba_numero: datos.bomba_numero || "",
        horometro_motor: datos.horometro_motor || "",
        empresa_id: (datos.empresa_id !== null && datos.empresa_id !== undefined) ? datos.empresa_id : 2,
        observaciones: datos.observaciones || "",
        ...checklistPayload
      };

      await axios.post(`${API_BASE_URL}/bomberman/checklist`, payload);
      localStorage.setItem(
        "bomberman_checklist_respuestas",
        JSON.stringify({
          weekKey: getCurrentWeekKey(),
          datos: { ...datos },
          estadoItems: { ...estadoItems }
        })
      );
      alert("✅ Checklist guardado correctamente.");
      navigate(-1);
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.response?.data ?? err?.message ?? err;
      alert(`Error al guardar el checklist: ${msg}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit} noValidate>
      <div className="card-section" style={{ marginBottom: 16 }}>
        <h3 className="card-title" style={{ marginBottom: 12 }}>
          LISTA DE CHEQUEO PARA BOMBA ESTACIONARIA DE CONCRETO (CIFA O TURBOSOL)
        </h3>
        {cargo && (
          <p style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>
            Mostrando checklist para cargo: <strong>{cargo === "operario" ? "Operario" : "Auxiliar"}</strong>
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {[
            { name: "nombre_cliente", label: "Cliente / Constructora" },
            { name: "nombre_proyecto", label: "Obra / Proyecto" },
            { name: "fecha_servicio", label: "Fecha", type: "date" },
            { name: "nombre_operador", label: "Operario" },
            { name: "bomba_numero", label: "BOMBA No.", type: "select" },
            { name: "horometro_motor", label: "HOROMETRO MOTOR" }
          ].map((item) => {
            const isHeaderError = camposFaltantes.includes(item.name);
            const isMandatory = item.name === "bomba_numero" || item.name === "horometro_motor";

            return (
              <div key={item.name} style={{ flex: 1, minWidth: 180 }}>
                <label className="permiso-trabajo-label">
                  {item.label}
                  {isMandatory && " *"}
                </label>
                {item.type === "select" ? (
                  <select
                    ref={item.name === "bomba_numero" ? bombaRef : null}
                    name={item.name}
                    value={datos[item.name] ?? ""}
                    onChange={handle_change}
                    className={`permiso-trabajo-select ${isHeaderError ? "campo-error" : ""}`}
                  >
                    <option value="">Seleccionar</option>
                    {lista_bombas.map((b, idx) => (
                      <option key={idx} value={b.numero_bomba}>
                        {b.numero_bomba}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    ref={item.name === "horometro_motor" ? horometroRef : null}
                    type={item.type || "text"}
                    name={item.name}
                    value={datos[item.name] ?? ""}
                    onChange={handle_change}
                    className="permiso-trabajo-input"
                    readOnly={
                      ["nombre_cliente", "nombre_proyecto", "fecha_servicio", "nombre_operador"].includes(item.name)
                    }
                  />
                )}
                {isHeaderError && (
                  <span style={{ color: "red", fontSize: 13 }}>
                    Este campo es obligatorio.
                    <span
                      style={{ marginLeft: 8, cursor: "pointer", fontSize: 18, verticalAlign: "middle" }}
                      onClick={scrollToBottom}
                      title="Ir al botón Guardar"
                    >
                      →
                    </span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {SECCIONES.map((seccion, idx) => {
        const fieldsVisibles = seccion.fields.filter((f) => campoVisibleParaCargo(f, cargo));
        if (fieldsVisibles.length === 0) return null;

        return (
          <div className="card-section" key={idx} style={{ marginBottom: 16 }}>
            <h4 className="card-title">{seccion.titulo}</h4>
            {fieldsVisibles.map((field) => {
              const esCampoDatos = field in CAMPOS_EN_DATOS;
              const isStateError = camposFaltantes.includes(field);
              const isObservationError = camposFaltantes.includes(`${field}_observacion`);
              const est = estadoItems[field]?.estado ?? "";
              const opts = FIELD_OPTIONS[field];
              const needsObservation = opts
                ? (opts.indexOf(est) > 0)
                : (est === "REGULAR" || est === "MALO");

              if (esCampoDatos) {
                const tipo = CAMPOS_EN_DATOS[field];
                return (
                  <div key={field} style={{ marginBottom: 16 }} ref={(el) => (itemRefs.current[field] = el)}>
                    <div className="permiso-trabajo-label">{FIELD_TO_TEXT[field]}</div>
                    <input
                      type={tipo}
                      name={field}
                      value={datos[field] ?? ""}
                      onChange={handle_change}
                      className="permiso-trabajo-input"
                      style={{ maxWidth: 320 }}
                      min={tipo === "number" ? 0 : undefined}
                      step={tipo === "number" ? 1 : undefined}
                    />
                  </div>
                );
              }

              const opciones = FIELD_OPTIONS[field] || ["BUENO", "REGULAR", "MALO"];
              const opcionesLabel = { SI: "Sí", NO: "No", SI_FALTAN: "Sí faltan", NO_FALTAN: "No faltan", CUMPLE: "Cumple", NO_CUMPLE: "No cumple", EMULSIONADO: "Emulsionado", LIMPIO: "Limpio", NO_LIMPIO: "No limpio", REALIZADO: "Realizado", NO_REALIZADO: "No realizado" };

              return (
                <div
                  key={field}
                  style={{ marginBottom: 16, paddingBottom: 16 }}
                  ref={(el) => (itemRefs.current[field] = el)}
                >
                  <div className="permiso-trabajo-label">{FIELD_TO_TEXT[field]}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <select
                      value={estadoItems[field]?.estado ?? ""}
                      onChange={(e) => handleItemStateChange(field, e.target.value)}
                      className={`permiso-trabajo-select ${isStateError ? "campo-error" : ""}`}
                      style={{ minWidth: 160, maxWidth: 320 }}
                    >
                      <option value="">--</option>
                      {opciones.map((opt) => (
                        <option key={opt} value={opt}>{opcionesLabel[opt] || opt}</option>
                      ))}
                    </select>
                    {field === "chasis_nivel_combustible" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label className="permiso-trabajo-label" style={{ fontSize: 13 }}>
                          Observación (ej. galones)
                        </label>
                        <input
                          ref={(el) => (itemRefs.current[`${field}_observacion`] = el)}
                          type="text"
                          value={estadoItems[field]?.observacion ?? ""}
                          onChange={(e) => handleItemObservationChange(field, e.target.value)}
                          className={`permiso-trabajo-input ${isObservationError ? "campo-error" : ""}`}
                          style={{ width: 140 }}
                          placeholder="Ej: 450 galones"
                        />
                        {isObservationError && (
                          <span style={{ color: "red", fontSize: 12 }}>
                            Detalle obligatorio para Regular/Malo.
                          </span>
                        )}
                      </div>
                    )}
                    {isStateError && (
                      <span style={{ color: "red", fontSize: 13 }}>
                        Selección obligatoria.
                        <span
                          style={{ marginLeft: 8, cursor: "pointer", fontSize: 18, verticalAlign: "middle" }}
                          onClick={scrollToBottom}
                          title="Ir al botón Guardar"
                        >
                          →
                        </span>
                      </span>
                    )}
                  </div>
                  {needsObservation && field !== "chasis_nivel_combustible" && (
                    <div style={{ marginTop: 8 }}>
                      <label className="permiso-trabajo-label" style={{ fontSize: "0.9em", fontWeight: "bold" }}>
                        Observación (Detalle requerido):
                      </label>
                      <textarea
                        ref={(el) => (itemRefs.current[`${field}_observacion`] = el)}
                        value={estadoItems[field]?.observacion ?? ""}
                        onChange={(e) => handleItemObservationChange(field, e.target.value)}
                        className={`permiso-trabajo-input ${isObservationError ? "campo-error" : ""}`}
                        rows={2}
                        style={{ width: "93%" }}
                      />
                      {isObservationError && (
                        <span style={{ color: "red", fontSize: 13 }}>
                          Detalle de observación obligatorio.
                          <span
                            style={{ marginLeft: 8, cursor: "pointer", fontSize: 18, verticalAlign: "middle" }}
                            onClick={scrollToBottom}
                            title="Ir al botón Guardar"
                          >
                            →
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="card-section" style={{ marginBottom: 24, padding: 20 }}>
        <label className="permiso-trabajo-label">Observaciones generales</label>
        <textarea
          name="observaciones"
          value={datos.observaciones ?? ""}
          onChange={handle_change}
          className="permiso-trabajo-input"
          rows={4}
        />
      </div>

      <div style={{ textAlign: "right", marginTop: 24 }} ref={submitRef}>
        <button
          type="submit"
          className="button"
          style={{ background: "#ff9800", color: "#fff", padding: "12px 24px", fontSize: 16 }}
          disabled={enviando}
        >
          {enviando ? "Guardando..." : "Guardar Checklist"}
        </button>
      </div>
    </form>
  );
}

export default Checklist;
