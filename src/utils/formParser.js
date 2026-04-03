/**
 * formParser.js — convierte worldId en secciones de preguntas,
 * y convierte respuestas gamificadas al formato original del backend.
 *
 * Funciones exportadas:
 *   parseFormToQuestions(worldId) → Section[] | null
 *   convertAnswersToFormData(worldId, answers) → payload para el backend
 *   submitFormData(worldId, answers) → Promise<void>
 *
 * Regla: el backend recibe EXACTAMENTE el mismo payload que los formularios
 * originales envían. Los campos no capturados en la UI gamificada se leen
 * del localStorage (datos guardados previamente) o usan 'NA' como default.
 */
import axios from 'axios';
import { getCurrentWeekKey, todayStrBogota } from './dateUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  || 'https://gruaman-bomberman-back.onrender.com';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convierte valor gamificado ('yes'|'no'|'na') a 'SI'|'NO'|'NA' */
const yn = (val) =>
  val === 'yes' ? 'SI'
  : val === 'na' ? 'NA'
  : 'NO';

/**
 * Lee las claves que BienvenidaSeleccion y el flujo de juego escriben
 * en localStorage. Estas siempre están disponibles cuando el usuario
 * está en modo juego.
 */
function getGameContext() {
  try {
    return {
      operador:  localStorage.getItem('nombre_trabajador') || '',
      cargo:     localStorage.getItem('cargo_trabajador')  || '',
      cliente:   localStorage.getItem('constructora')      || '',
      proyecto:  localStorage.getItem('nombre_proyecto')   || localStorage.getItem('obra') || '',
      obraId:    localStorage.getItem('obra_id')           || '',
    };
  } catch {
    return { operador: '', cargo: '', cliente: '', proyecto: '', obraId: '' };
  }
}

/** Fecha de hoy en formato YYYY-MM-DD (zona horaria Colombia) */
const todayStr = todayStrBogota;

/** Clave de semana actual (para localStorage) — misma lógica que los formularios */
const weekKey = getCurrentWeekKey;

// ─── Datos del Checklist (duplicados aquí para builders y secciones dinámicas) ─

const CHECKLIST_ITEM_ROLES = {
  radio_marca_serial_estado: "ambos", radio_estado: "ambos", verificacion_botiquin: "ambos",
  kit_antiderrames: "ambos", arnes_marca_serial_fecha_estado: "ambos", eslinga_marca_serial_fecha_estado: "ambos",
  chasis_aceite_motor: "operario", chasis_nivel_combustible: "operario", chasis_nivel_refrigerante: "operario",
  chasis_presion_llantas: "operario", chasis_fugas: "operario", chasis_soldadura: "operario",
  chasis_integridad_cubierta: "operario", chasis_herramientas_productos_diversos: "operario",
  chasis_sistema_alberca: "operario", chasis_nivel_agua: "operario",
  combustible_pimpinas: "operario", ultima_fecha_lavado_tanque: "operario",
  aceite_hidrolavadora: "operario", sensor_motor_aspas: "operario",
  filtro_hidraulico_equipo: "operario", filtro_primario_combustible: "operario",
  filtro_aire: "operario", drenaje_filtro_combustible: "operario", filtro_hidraulico_limalla: "operario",
  anillos: "operario", placa_gafa: "operario", cilindros_atornillados: "operario",
  partes_faltantes: "operario", mecanismo_s: "operario", estado_oring: "operario",
  funcion_vibrador: "operario", paletas_eje_agitador: "operario", motor_accionamiento: "operario",
  valvula_control: "operario",
  pistones_paso_masilla: "operario", pistones_paso_agua: "operario",
  partes_faltantes_nuevo: "operario", caja_agua_condiciones: "operario",
  mecanismo_tubo_s: "operario", rejilla_tolva_sensor: "operario",
  mangueras_tubos_hidraulicos: "operario", caja_agua: "operario", rejilla_tolva: "operario",
  superficie_nivel_deposito_grasa: "operario", superficie_puntos_lubricacion: "operario",
  superficie_empaquetaduras_conexion: "operario", superficie_nivel_agua_lubricacion: "operario",
  dias_grasa: "operario", punto_engrase_tapado: "operario", ultima_fecha_mantenimiento_salida: "operario",
  hidraulico_fugas: "auxiliar", hidraulico_cilindros_botellas_estado: "auxiliar",
  hidraulico_indicador_nivel_aceite: "auxiliar", hidraulico_enfriador_termotasto: "auxiliar",
  hidraulico_indicador_filtro: "auxiliar", hidraulico_mangueras_tubos_sin_fugas: "auxiliar",
  mangueras_interna_no_deshilachadas: "auxiliar", mangueras_acoples_buen_estado: "auxiliar",
  mangueras_externa_no_deshilachado: "auxiliar",
  mangueras_3_pulgadas: "auxiliar", mangueras_4_pulgadas: "auxiliar", mangueras_5_pulgadas: "auxiliar",
  mangueras_sin_acoples: "auxiliar",
  electrico_interruptores_buen_estado: "auxiliar", electrico_luces_funcionan: "auxiliar",
  electrico_cubiertas_proteccion_buenas: "auxiliar", electrico_cordon_mando_buen_estado: "auxiliar",
  electrico_interruptores_emergencia_funcionan: "auxiliar", electrico_conexiones_sin_oxido: "auxiliar",
  electrico_paros_emergencia: "auxiliar", electrico_aisladores_cables_buenos: "auxiliar",
  cables_solenoide: "auxiliar",
  tuberia_abrazaderas_codos_ajustadas: "auxiliar", tuberia_bujia_tallo_anclados: "auxiliar",
  tuberia_abrazaderas_descarga_ajustadas: "auxiliar", tuberia_espesor: "auxiliar",
  tuberia_vertical_tallo_recta: "auxiliar", tuberia_desplazamiento_seguro: "auxiliar",
  codo_abrazadera_salida: "auxiliar", limpieza_abrazaderas_empaques: "auxiliar",
  estado_abrazaderas_empaques: "auxiliar", numero_piso_fundiendo: "auxiliar",
  cantidad_puntos_anclaje: "auxiliar", ultima_fecha_medicion_espesores: "auxiliar",
  vertical_tallo_recta: "auxiliar"
};

const CHECKLIST_ITEM_FIELDS = [
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
  "electrico_cordon_mando_buen_estado", "electrico_interruptores_emergencia_funcionan",
  "electrico_conexiones_sin_oxido", "electrico_paros_emergencia", "electrico_aisladores_cables_buenos",
  "cables_solenoide",
  "tuberia_abrazaderas_codos_ajustadas", "tuberia_bujia_tallo_anclados",
  "tuberia_abrazaderas_descarga_ajustadas", "tuberia_espesor", "tuberia_vertical_tallo_recta",
  "tuberia_desplazamiento_seguro", "codo_abrazadera_salida", "limpieza_abrazaderas_empaques",
  "estado_abrazaderas_empaques", "numero_piso_fundiendo", "cantidad_puntos_anclaje",
  "ultima_fecha_medicion_espesores", "vertical_tallo_recta"
];

const CHECKLIST_CAMPOS_EN_DATOS = {
  radio_marca_serial_estado: "text", arnes_marca_serial_fecha_estado: "text",
  eslinga_marca_serial_fecha_estado: "text",
  combustible_pimpinas: "number", ultima_fecha_lavado_tanque: "date",
  punto_engrase_tapado: "text", ultima_fecha_mantenimiento_salida: "date", dias_grasa: "number",
  mangueras_3_pulgadas: "number", mangueras_4_pulgadas: "number", mangueras_5_pulgadas: "number",
  mangueras_sin_acoples: "text", numero_piso_fundiendo: "number", cantidad_puntos_anclaje: "number",
  ultima_fecha_medicion_espesores: "date"
};

const CHECKLIST_FIELD_OPTIONS = {
  radio_estado: ["BUENO", "MALO"], verificacion_botiquin: ["BUENO", "MALO"],
  kit_antiderrames: ["BUENO", "MALO"], aceite_hidrolavadora: ["BUENO", "EMULSIONADO"],
  sensor_motor_aspas: ["SI", "NO"], filtro_hidraulico_equipo: ["BUENO", "MALO"],
  filtro_primario_combustible: ["LIMPIO", "NO_LIMPIO"], filtro_aire: ["BUENO", "MALO"],
  drenaje_filtro_combustible: ["REALIZADO", "NO_REALIZADO"], filtro_hidraulico_limalla: ["BUENO", "MALO"],
  pistones_paso_masilla: ["BUENO", "MALO"], pistones_paso_agua: ["BUENO", "MALO"],
  partes_faltantes_nuevo: ["SI_FALTAN", "NO_FALTAN"], caja_agua_condiciones: ["CUMPLE", "NO_CUMPLE"],
  mecanismo_tubo_s: ["SI", "NO"], rejilla_tolva_sensor: ["BUENO", "MALO"],
  cables_solenoide: ["BUENO", "MALO"], codo_abrazadera_salida: ["BUENO", "MALO"],
  limpieza_abrazaderas_empaques: ["BUENO", "MALO"], estado_abrazaderas_empaques: ["BUENO", "MALO"],
  vertical_tallo_recta: ["SI", "NO"]
};

const CHECKLIST_FIELD_TO_TEXT = {
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
  combustible_pimpinas: "Indique la cantidad de combustible en pimpinas (número).",
  ultima_fecha_lavado_tanque: "Última fecha de lavado de tanque de combustible.",
  aceite_hidrolavadora: "Revise el nivel del aceite de la hidrolavadora.",
  sensor_motor_aspas: "¿Cuenta con el sensor bueno del motor de aspas?",
  filtro_hidraulico_equipo: "Revisión del filtro hidráulico del equipo.",
  filtro_primario_combustible: "Revisión del filtro primario de combustible (debe estar limpio).",
  filtro_aire: "Revise y realice limpieza del filtro de aire.",
  drenaje_filtro_combustible: "Realice drenaje de filtro de combustible.",
  filtro_hidraulico_limalla: "Revisar que el filtro hidráulico no tenga limalla.",
  anillos: "Revise anillo de corte y anillo de sujeción.",
  placa_gafa: "Revise placa gafa.",
  cilindros_atornillados: "Revisar que los cilindros de empuje estén bien asegurados y atornillados.",
  partes_faltantes: "Revisar si hay partes faltantes (pasadores, pernos y tuercas).",
  mecanismo_s: "Revise que el mecanismo de cambio del tubo en S sea estructuralmente rígido.",
  estado_oring: "Revise el estado del oring de la escotilla.",
  funcion_vibrador: "Revisar que el vibrador esté montado en forma segura y funcionando correctamente.",
  paletas_eje_agitador: "Revise que las paletas y el eje del agitador no estén dañados.",
  motor_accionamiento: "Revise si el motor de accionamiento está asegurado y en buenas condiciones.",
  valvula_control: "Revise que la válvula de control esté montada correctamente y las palancas se muevan libremente.",
  pistones_paso_masilla: "Revise los pistones — no debe existir paso de masilla a la caja de refrigeración.",
  pistones_paso_agua: "Revise los pistones — no debe existir paso de agua a la tolva.",
  partes_faltantes_nuevo: "¿Hay partes faltantes (pasadores, pernos y tuercas)?",
  caja_agua_condiciones: "Revise que la caja de agua sea estructuralmente rígida y el drenaje funcional.",
  mecanismo_tubo_s: "¿El mecanismo de cambio del tubo en S es estructuralmente rígido?",
  rejilla_tolva_sensor: "Revisar que la rejilla de la tolva no esté partida y que funcione el sensor.",
  hidraulico_fugas: "Revisar que no existan fugas hidráulicas.",
  hidraulico_cilindros_botellas_estado: "Revisar si los cilindros hidráulicos o botellas impulsadoras estén asegurados y en buenas condiciones.",
  hidraulico_indicador_nivel_aceite: "Revise el nivel del aceite de la hidrolavadora.",
  hidraulico_enfriador_termotasto: "Revise enfriador aceite hidráulico y su termostato.",
  hidraulico_indicador_filtro: "Revisión del filtro hidráulico del equipo.",
  hidraulico_mangueras_tubos_sin_fugas: "Revise que las mangueras y tubos hidráulicos estén asegurados, sin fugas.",
  superficie_nivel_deposito_grasa: "Revise el nivel del depósito de grasa.",
  superficie_puntos_lubricacion: "Revise puntos de lubricación.",
  superficie_empaquetaduras_conexion: "Revise empaquetaduras de conexión del tubo en S y sellos de salida.",
  superficie_nivel_agua_lubricacion: "Revise el nivel de agua de caja de lubricación de los pistones.",
  dias_grasa: "¿Para cuántos días queda grasa? (número)",
  punto_engrase_tapado: "¿Qué punto de engrase está tapado?",
  ultima_fecha_mantenimiento_salida: "Última fecha de mantenimiento de salida.",
  mangueras_interna_no_deshilachadas: "Revisión interna — la manguera no debe estar deshilachada.",
  mangueras_acoples_buen_estado: "Revisión de acoples — deben estar en buen estado.",
  mangueras_externa_no_deshilachado: "Revisión externa — la manguera no debe estar deshilachada.",
  mangueras_3_pulgadas: "¿Cuántas mangueras de 3\" tiene en obra? (número)",
  mangueras_4_pulgadas: "¿Cuántas mangueras de 4\" tiene en obra? (número)",
  mangueras_5_pulgadas: "¿Cuántas mangueras de 5\" tiene en obra? (número)",
  mangueras_sin_acoples: "¿Cuál de las mangueras no tiene acoples?",
  electrico_interruptores_buen_estado: "Revisar que los interruptores estén en buenas condiciones.",
  electrico_luces_funcionan: "Revisar que los instrumentos, indicadores y las luces funcionen.",
  electrico_cubiertas_proteccion_buenas: "Revisar que las cubiertas de caucho de protección estén en buenas condiciones.",
  electrico_cordon_mando_buen_estado: "Revisar que el cordón de mando esté en buenas condiciones.",
  electrico_interruptores_emergencia_funcionan: "Revise las funciones de los interruptores de parada de emergencia.",
  electrico_conexiones_sin_oxido: "Revisar que las conexiones eléctricas estén bien aseguradas y libres de óxido.",
  electrico_paros_emergencia: "Revisar paros de emergencia.",
  electrico_aisladores_cables_buenos: "Revisar que los aisladores de los cables no estén desgastados.",
  cables_solenoide: "Revisar cables de la solenoide.",
  tuberia_abrazaderas_codos_ajustadas: "Revisar que el codo de salida esté asegurado y la abrazadera esté fija.",
  tuberia_bujia_tallo_anclados: "Colocación de tubería y tallo (bien anclada a la estructura).",
  tuberia_abrazaderas_descarga_ajustadas: "Revise si las abrazaderas de los tubos de descarga están flojas o dañadas.",
  tuberia_espesor: "Revise espesores de tubería.",
  tuberia_vertical_tallo_recta: "Revise que la vertical o tallo se encuentre recta.",
  tuberia_desplazamiento_seguro: "Revisar el área de desplazamiento de la tubería.",
  mangueras_tubos_hidraulicos: "Revise la condición de las mangueras y tubos hidráulicos.",
  caja_agua: "Revise que la caja de agua sea estructuralmente rígida, limpia y el drenaje funcional.",
  rejilla_tolva: "Revisar que la rejilla de la tolva no esté partida y que funcione el sensor.",
  codo_abrazadera_salida: "Indique el estado del codo de salida y la abrazadera de salida.",
  limpieza_abrazaderas_empaques: "Reporte de limpieza de abrazaderas y empaques.",
  estado_abrazaderas_empaques: "Estado de abrazaderas y empaques.",
  numero_piso_fundiendo: "¿En qué número de piso está fundiendo? (número)",
  cantidad_puntos_anclaje: "¿Cuántos puntos de anclaje tiene? (número)",
  ultima_fecha_medicion_espesores: "Última fecha de medición de espesores de tubería.",
  vertical_tallo_recta: "¿La vertical o tallo se encuentra recta?"
};

const CHECKLIST_SECCIONES = [
  { titulo: "RADIO, BOTIQUÍN, KIT ANTIDERRAMES, ARNÉS Y ESLINGA", fields: CHECKLIST_ITEM_FIELDS.slice(0, 6) },
  { titulo: "CHASIS", fields: CHECKLIST_ITEM_FIELDS.slice(6, 25) },
  {
    titulo: "PIEZAS DE DESGASTE Y SALIENTES",
    fields: [
      ...CHECKLIST_ITEM_FIELDS.slice(25, 41),
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
      "superficie_nivel_agua_lubricacion", "superficie_nivel_deposito_grasa",
      "superficie_puntos_lubricacion", "superficie_empaquetaduras_conexion",
      "dias_grasa", "punto_engrase_tapado", "ultima_fecha_mantenimiento_salida"
    ]
  },
  { titulo: "MANGUERAS Y ACOPLES", fields: CHECKLIST_ITEM_FIELDS.slice(57, 64) },
  { titulo: "SISTEMA ELÉCTRICO", fields: CHECKLIST_ITEM_FIELDS.slice(64, 73) },
  { titulo: "TUBERÍA", fields: CHECKLIST_ITEM_FIELDS.slice(73) }
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
    } catch { /* ignorar */ }
  }
  const c = cargoRaw.toLowerCase();
  if (c.includes("auxiliar") || c.includes("ayudante") || c.includes("asistente")) return "auxiliar";
  if (c.includes("operario") || c.includes("operador")) return "operario";
  return null;
}

function campoVisibleParaCargo(field, cargo) {
  if (!cargo) return true;
  const rol = CHECKLIST_ITEM_ROLES[field];
  if (!rol) return false;
  if (rol === "ambos") return true;
  return rol === cargo;
}

/** Etiquetas de display para los valores del checklist */
const CHECKLIST_OPTION_DISPLAY = {
  BUENO:        { label: 'Bueno',      icon: '✓' },
  REGULAR:      { label: 'Regular',    icon: '~' },
  MALO:         { label: 'Malo',       icon: '✗' },
  SI:           { label: 'Sí',         icon: '✓' },
  NO:           { label: 'No',         icon: '✗' },
  EMULSIONADO:  { label: 'Emulsionad', icon: '✗' },
  LIMPIO:       { label: 'Limpio',     icon: '✓' },
  NO_LIMPIO:    { label: 'No limpio',  icon: '✗' },
  REALIZADO:    { label: 'Realizado',  icon: '✓' },
  NO_REALIZADO: { label: 'No realiz.', icon: '✗' },
  SI_FALTAN:    { label: 'Sí faltan',  icon: '✗' },
  NO_FALTAN:    { label: 'No faltan',  icon: '✓' },
  CUMPLE:       { label: 'Cumple',     icon: '✓' },
  NO_CUMPLE:    { label: 'No cumple',  icon: '✗' },
};

/** Genera customOptions para una pregunta del checklist */
function buildChecklistOptions(field) {
  const raw = CHECKLIST_FIELD_OPTIONS[field] || ['BUENO', 'REGULAR', 'MALO'];
  return raw.map((value, idx) => {
    const d = CHECKLIST_OPTION_DISPLAY[value] || { label: value, icon: '?' };
    // Primer índice = respuesta positiva; el resto = negativa (pide observación)
    let className;
    if (idx === 0)                           className = 'ynq-btn--yes';
    else if (raw.length > 2 && idx === 1)    className = 'ynq-btn--na';
    else                                     className = 'ynq-btn--no';
    return { value, label: d.label, icon: d.icon, className, negative: idx > 0 };
  });
}

/** @deprecated — mantenido solo como referencia; buildChecklist ya usa valores directos */
function ynChecklist(val, field) {
  const opts = CHECKLIST_FIELD_OPTIONS[field];
  if (!opts) {
    // Sin opciones personalizadas: mapeo estándar BUENO/REGULAR/MALO
    return val === 'yes' ? 'BUENO' : val === 'na' ? 'REGULAR' : 'MALO';
  }
  // Campo de 2 opciones: yes=opts[0] (bueno), no=opts[1] (malo), na=opts[0] (bueno por defecto)
  return val === 'yes' ? opts[0] : val === 'no' ? opts[1] : opts[0];
}

/** Construye secciones de preguntas para el checklist según el cargo del usuario */
function buildChecklistSections() {
  const cargo = detectarCargo();

  // Primera sección: datos de la bomba
  const datosSection = {
    id: 'datos-bomba',
    name: 'Datos de la Bomba',
    enableTimer: false,
    questions: [
      { id: 'bomba_numero', type: 'number', question: 'Ingresa el número de la bomba:', icon: '🏎️', fieldName: 'bomba_numero' },
      { id: 'horometro_motor', type: 'number', question: 'Ingresa el valor del horómetro del motor:', icon: '⏱️', fieldName: 'horometro_motor' },
    ],
  };

  const secciones = [datosSection];

  CHECKLIST_SECCIONES.forEach((sec) => {
    const visibleFields = sec.fields.filter(f => campoVisibleParaCargo(f, cargo));
    if (visibleFields.length === 0) return;

    const questions = visibleFields.map(f => {
      if (f in CHECKLIST_CAMPOS_EN_DATOS) {
        const tipoCampo = CHECKLIST_CAMPOS_EN_DATOS[f];
        return {
          id: f,
          type: tipoCampo === 'date' ? 'date' : tipoCampo === 'number' ? 'number' : 'text',
          question: CHECKLIST_FIELD_TO_TEXT[f] || f,
          fieldName: f,
        };
      }
      return {
        id: f,
        type: 'yesno',
        question: CHECKLIST_FIELD_TO_TEXT[f] || f,
        fieldName: f,
        customOptions: buildChecklistOptions(f),
      };
    });

    secciones.push({
      id: sec.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''),
      name: sec.titulo,
      enableTimer: false,
      questions,
    });
  });

  return secciones;
}

// ─── ATS: Pasos por tipo ───────────────────────────────────────────────────────

const ATS_PASOS = {
  'ats-operacion-torregrua': [
    {
      nombre: 'Ingreso al Área de Trabajo',
      peligros: 'Resbalones, tropezones, caídas. Caída de objetos. Movimiento de maquinaria y vehículos. Choque de vehículos. Mordedura de caninos. Picaduras de zancudos.',
      consecuencias: 'Golpes, contusiones, raspaduras. Infección por herida abierta. Atropellamientos. Daños materiales.',
      controles: 'Caminar con precaución. Uso de senderos peatonales. Atención a la señalización. Orientar al personal sobre los riesgos. Supervisión SSTA de la obra.',
    },
    {
      nombre: 'Ascenso y Descenso con Equipos de Protección Contra Caídas (Arnés, Arrestador y Eslinga en Y)',
      peligros: 'Caída de objetos y personas. Trabajo en alturas. Desplome de estructura. Superficies irregulares. Exposición a rayos UV. Ruido por impactos. Posturas prolongadas y sobre esfuerzo. Riesgo biológico (virus, bacterias). Riesgo químico (material particulado). Fenómenos naturales: sismos, vendavales.',
      consecuencias: 'Caídas a diferente nivel. Fracturas, traumas, politraumatismos. Enfermedades infecciosas. Lesiones musculares, hernias discales. Aplastamientos. Muerte.',
      controles: 'Uso adecuado de EPP (casco, guantes, gafas, tapa oídos). Arnés cuerpo completo, eslinga en Y, arrestador de caídas. Inspección de equipos. Pausas durante la actividad. Diligenciar permiso de trabajo en alturas. Uso de bloqueador solar. Radios de comunicación.',
    },
    {
      nombre: 'Operación de Torre Grúa',
      peligros: 'Riesgo biológico, físico y químico por condiciones del ambiente. Posturas prolongadas, sobre esfuerzo, movimientos repetitivos. Desplome de estructura. Caída de objetos. Accidentes de tránsito. Fenómenos naturales: sismos, vendavales. Riesgo psicosocial.',
      consecuencias: 'Enfermedades infecciosas. Fatiga, cansancio, estrés. Dolores musculares y articulares. Politraumatismos. Lesiones leves y graves. Muerte.',
      controles: 'Uso adecuado de EPP. Dotación completa (camisa manga larga y jean). Equipos de protección contra caídas. Inspección de equipos de alturas. Pausas durante la actividad.',
    },
    {
      nombre: 'Izaje de Cargas',
      peligros: 'Caída de materiales. Caída de equipos y herramientas. Exceso de cargas. Mal amarre de la carga.',
      consecuencias: 'Aplastamientos. Muerte de peatones. Golpes, contusiones, heridas, raspaduras. Traumas. Muerte.',
      controles: 'Uso adecuado de equipos de protección contra caídas. Uso y revisión de aparejos. Inspección diaria de aparejos. Señalización y demarcación de las áreas. Uso de peatonales.',
    },
  ],

  'ats-mando-inalam': [
    {
      nombre: 'Ingreso al Área de Trabajo (Verificación de la Base y Encendido con Mando Inalámbrico)',
      peligros: 'Resbalones, tropezones, caídas. Caída de objetos. Movimiento de maquinaria y vehículos. Choque de vehículos. Mordedura de caninos. Picaduras de zancudos.',
      consecuencias: 'Golpes, contusiones, raspaduras. Infección por herida abierta. Atropellamientos. Daños materiales.',
      controles: 'Caminar con precaución. Uso de senderos peatonales. Atención a la señalización. Orientar al personal sobre los riesgos. Supervisión SSTA.',
    },
    {
      nombre: 'Operación de Torre Grúa desde Piso',
      peligros: 'Riesgo biológico, físico, químico y biomecánico. Posturas prolongadas de pie, movimientos repetitivos, manipulación manual de cargas. Desplome de estructura. Superficies irregulares. Fenómenos naturales: sismos, vendavales. Riesgo psicosocial.',
      consecuencias: 'Enfermedades infecciosas. Fatiga, estrés, cansancio. Dolores musculares. Lesiones osteomusculares. Politraumatismos. Lesiones leves y graves.',
      controles: 'Uso adecuado de EPP (casco, guantes, gafas, tapa oídos). Dotación completa (camisa manga larga y jean). Inspección de equipos de alturas. Pausas durante la actividad. Precaución y supervisión al realizar actividades críticas. Conocimiento de procedimientos en alturas.',
    },
    {
      nombre: 'Izaje de Cargas',
      peligros: 'Caída de materiales. Caída de equipos y herramientas. Exceso de cargas. Mal amarre de la carga.',
      consecuencias: 'Aplastamientos. Muerte de peatones. Golpes, contusiones, heridas, raspaduras. Traumas. Muerte.',
      controles: 'Uso adecuado de equipos de protección. Revisión e inspección de aparejos. Señalización y demarcación de áreas. Uso de peatonales.',
    },
    {
      nombre: 'Ascenso y Descenso para Verificación Eléctrica y Mecánica (Esporádico)',
      peligros: 'Caída de personas y objetos. Trabajo en alturas. Exposición a rayos UV. Riesgo eléctrico. Posturas forzadas y sobre esfuerzo. Riesgo biológico y químico. Fenómenos naturales.',
      consecuencias: 'Caídas a diferente nivel. Electrocución. Fracturas, traumas. Enfermedades infecciosas. Lesiones musculares. Muerte.',
      controles: 'EPP completo. Arnés cuerpo completo, eslinga en Y, arrestador. Permiso de trabajo en alturas. Inspección de equipos. Bloqueador solar. Radios de comunicación.',
    },
  ],

  'ats-montaje-torregrua': [
    {
      nombre: 'Ingreso al Área de Trabajo',
      peligros: 'Resbalones, tropezones, caídas. Caída de objetos. Distribución de máquinas y equipos. Movimiento de maquinaria y vehículos. Choque de vehículos.',
      consecuencias: 'Golpes, contusiones, raspaduras. Infección por herida abierta. Atropellamientos. Daños materiales.',
      controles: 'Caminar y conducir con precaución. Uso de senderos peatonales. Atención a la señalización. Orientar al personal sobre riesgos. Supervisión SSTA.',
    },
    {
      nombre: 'Cargue y Descargue de Equipos y Herramientas',
      peligros: 'Locativo: superficies irregulares, obstáculos. Biomecánico: posturas sostenidas, manipulación de cargas. Químico: material particulado. Mecánico: partes en movimiento, izaje de cargas. Biológico: virus, bacterias. Fenómenos naturales: sismo.',
      consecuencias: 'Fatiga, cansancio, estrés. Cortaduras, heridas abiertas. Quemaduras por el sol. Golpes, contusiones, traumas. Muerte.',
      controles: 'Uso adecuado de EPP y ropa adecuada (guantes, casco, botas punteras, camisa manga larga, jean). Precaución durante la actividad. Ayuda entre compañeros.',
    },
    {
      nombre: 'Montaje de Torre Grúa (Instalación de Brazo, Mástil, Cabina, Carrito, Cable de Carga, Flecha, Contra Flecha, Contra Peso, Contra Brazo, Secciones)',
      peligros: 'Caída de objetos, equipos, herramientas y materiales. Sobre esfuerzo. Trabajo en alturas. Desplome de estructura. Posturas prolongadas. Atrapamientos de dedos. Atrapamientos en la estructura. Caídas de diferentes niveles. Ruido. Vibraciones. Exposición a radiaciones UV.',
      consecuencias: 'Lesiones en piel, dermatitis, laceraciones en manos y dedos. Quemaduras en la piel. Lesiones osteomusculares. Golpes, lesiones, fracturas. Fracturas por atrapamientos en la estructura.',
      controles: 'EPP completo (casco, guantes, gafas, tapa oídos). Dotación (camisa manga larga y jean). Equipos de protección contra caídas. Inspección de seguridad y equipos. Pausas durante la actividad. Charla de seguridad. Conocimiento de procedimientos en alturas. Bloqueador solar.',
    },
    {
      nombre: 'Izaje de Cargas (Por Medio de Ayuda Hidráulica PH)',
      peligros: 'Atropellamientos. Caída de materiales. Aplastamiento. Caída de equipos y herramientas. Exceso de cargas. Mal amarre de la carga.',
      consecuencias: 'Aplastamientos. Muerte de peatones. Golpes, contusiones, heridas, raspaduras. Traumas. Muerte.',
      controles: 'Plan de izaje. Uso adecuado de equipos de protección contra caída. Uso adecuado de los aparejos. Inspección diaria de aparejos. Señalización y demarcación de las áreas. No pasar por el área donde esté la carga suspendida.',
    },
  ],

  'ats-montaje-elevador': [
    {
      nombre: 'Ingreso al Área de Trabajo',
      peligros: 'Locativos: pisos en diferentes niveles, rampas, terreno inestable, acceso de áreas por escaleras. Biomecánico: movimientos repetitivos, posturas prolongadas, sobre esfuerzo. Biológico: bacterias, virus. Físico: ruido, iluminación deficiente. Fenómenos Naturales: sismos, terremotos, granizadas.',
      consecuencias: 'Caída a mismo y diferente nivel. Fracturas, traumatismos, golpes, atropellamiento, machucones. Golpes, fracturas, traumatismos, machucones, laceraciones. Daños materiales. Muerte por fenómenos naturales.',
      controles: 'Transitar por las áreas asignadas. Precaución durante el desplazamiento. Seguir indicaciones del personal. EPP: casco, guantes, botas antideslizantes con puntera, guantes de camaza, ropa de trabajo, gafas, tener precaución con los trabajos que se están realizando en el área. Solicitar al personal de seguridad el plan de inducción.',
    },
    {
      nombre: 'Cargue y Descargue de Equipos y Herramientas',
      peligros: 'Locativos: pisos en diferentes niveles, terreno inestable. Biomecánico: movimientos repetitivos, posturas prolongadas, sobre esfuerzo, manipulación manual de cargas. Biológico: bacterias, virus. Fenómenos Naturales: sismos, temblores.',
      consecuencias: 'Caída a mismo y diferente nivel. Fracturas, traumatismos, golpes, atropellamiento. Molestias musculares, dolor de espalda, lumbalgias. Disminución de la capacidad auditiva. Lesiones laborales.',
      controles: 'Transitar por las áreas asignadas. EPP completo. Realizar pausas activas para las extremidades inferiores. Organizar, coordinar y distribuir el trabajo para no exceder el horario estipulado. Utilizar ayudas mecánicas para el transporte de elementos pesados.',
    },
    {
      nombre: 'Inspección y Señalización',
      peligros: 'Locativos: pisos en diferentes niveles, rampas, terreno inestable. Biomecánico: movimientos repetitivos, posturas prolongadas. Biológico: bacterias, virus. Físico: ruido, iluminación deficiente. Fenómenos Naturales: sismos, temblores.',
      consecuencias: 'Caída a mismo y diferente nivel. Fracturas, golpes, traumatismos, atropellamiento. Disminución de la capacidad auditiva. Fatiga, cansancio.',
      controles: 'Transitar por áreas asignadas. EPP adecuado. Señalizar el área de trabajo. Realizar pausas activas.',
    },
    {
      nombre: 'Cableado de Alimentación para Motor, Bancada e Izaje de Motor (Con Diferencial o Winche)',
      peligros: 'Atropellamientos. Caída de materiales. Caída de equipos y herramientas. Exceso de cargas. Mal amarre de la carga.',
      consecuencias: 'Aplastamientos. Muerte de peatones. Golpes, contusiones, heridas, raspaduras. Traumas.',
      controles: 'Plan de izaje. Señalización y demarcación de las áreas. Uso adecuado de equipos de protección. Inspección de equipos de alturas. Uso adecuado de la dotación.',
    },
    {
      nombre: 'Perforación para Arriostramientos en Pared o Piso',
      peligros: 'Locativos: acceso de áreas por escaleras, terreno inestable. Biomecánico: movimientos repetitivos, posturas prolongadas, sobre esfuerzo. Físico: ruido, vibración por uso del taladro. Trabajo en alturas. Biológico: bacterias, virus. Fenómenos Naturales: sismos.',
      consecuencias: 'Caída a mismo y diferente nivel. Fatiga muscular, lumbalgias. Estrés, ansiedad, dolores de cabeza. Golpes, heridas, laceraciones. Politraumatismos. Disminución de la capacidad auditiva.',
      controles: 'Realizar pausas activas. EPP completo. Botas de seguridad antideslizantes con puntera. Uso de EPP: protección auditiva. Buena iluminación en las áreas. Guantes de nitrilo y/o carnaza para evitar cortaduras.',
    },
    {
      nombre: 'Puesta en Marcha y Prueba de Carga',
      peligros: 'Locativos: acceso de áreas por escaleras, terreno inestable, sobre esfuerzo. Biomecánico: movimientos repetitivos. Mecánico: manejo de herramienta de mano y eléctricas. Fenómenos Naturales: sismos, vendavales, precipitaciones. Riesgo eléctrico: quemaduras, electrocución.',
      consecuencias: 'Caída a mismo y diferente nivel. Fatiga muscular, lumbalgias. Golpes, contusiones. Caídas al mismo nivel. Disminución de la capacidad auditiva. Fatiga y cansancio. Tetanización muscular, quemaduras.',
      controles: 'Charla de seguridad. Realizar pausas activas para las extremidades inferiores. EPP completo. Botas de seguridad antideslizantes. Capacitación. Formatos de permisos para trabajo en alturas. Inspección de equipos de alturas.',
    },
    {
      nombre: 'Orden y Aseo',
      peligros: 'Locativos: pisos en diferentes niveles, rampas, terreno inestable. Biomecánico: movimientos repetitivos. Biológico: bacterias, virus. Físico: ruido, iluminación deficiente. Fenómenos Naturales: sismos, temblores.',
      consecuencias: 'Caída a mismo y diferente nivel. Fracturas, traumatismos, golpes. Fatiga muscular, lumbalgias. Estrés, ansiedad, dolores de cabeza. Golpes, heridas, laceraciones, machucones.',
      controles: 'Charla de seguridad. Separación de residuos. Uso adecuado de EPP.',
    },
  ],

  'ats-desmontaje-torregrua': [
    {
      nombre: 'Ingreso al Área de Trabajo',
      peligros: 'Locativo: resbalones, tropezones, caídas. Mecánico: distribución de máquinas y equipos. Movimiento de maquinaria y vehículos. Biológico: virus, bacterias, hongos y parásitos. Químico: material particulado en el ambiente. Físico: iluminación natural. Psicosocial: gestión organizacional, jornada extensa de trabajo. Fenómenos naturales: sismos, terremotos, granizadas.',
      consecuencias: 'Golpes, contusiones. Infección por herida abierta. Atropellamientos. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Caminar con precaución. Uso de senderos peatonales. Atención a señalización y respetar señales de tránsito. Uso de EPP. Capacitación, inducción de ingreso. Trabajo en equipo, charla de comunicación asertiva. Supervisión SSTA.',
    },
    {
      nombre: 'Cargue y Descargue de Equipos y Herramientas Previo a Realizar el Ascenso',
      peligros: 'Locativo: superficies irregulares, obstáculos en los sitios de trabajo. Biomecánico: posturas sostenidas, manipulación de cargas, movimientos forzados. Físico: exposición a ruido simultáneo. Químico: material particulado. Biológico: virus, bacterias propias de la actividad. Fenómenos naturales: sismo.',
      consecuencias: 'Golpes, traumas, contusiones. Machucones con herramientas. Raspaduras. Fracturas. Heridas abiertas. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Uso adecuado de EPP y ropa adecuada (guantes, casco, botas punteras, camisa manga larga, jean). Precaución durante la actividad. Ayuda entre compañeros.',
    },
    {
      nombre: 'Ascenso a la Torre Grúa',
      peligros: 'Locativo: caída de equipos y herramientas, caída de personas, caída de materiales. Biomecánico: sobre esfuerzo, movimientos repetitivos. Alturas: trabajo en alturas, desplome de estructura. Biológico: virus, bacterias, hongos y parásitos. Químico: material particulado en el ambiente. Físico: iluminación natural, ruido. Psicosocial: gestión organizacional, jornada extensa de trabajo. Fenómenos naturales: sismos, terremotos, granizadas.',
      consecuencias: 'Fatiga, cansancio, estrés. Golpes, contusiones, traumas. Fracturas. Quemaduras por el sol. Heridas abiertas. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Uso adecuado de EPP (casco, guantes, gafas, tapa oídos). Dotación (camisa manga larga y jean). Equipos de protección contra caídas. Inspección de equipos de alturas. Pausas durante la actividad. Precaución al realizar actividades. Charla de seguridad. Conocimiento de procedimientos en alturas. Bloqueador solar.',
    },
    {
      nombre: 'Desmontaje de Torre Grúa (Brazo, Mástil, Cabina, Cable de Carga, Contra Flecha, Contra Peso, Contra Brazo, Secciones)',
      peligros: 'Caída de equipos y herramientas. Caída de personas. Caída de materiales. Biomecánico: sobre esfuerzo, movimientos repetitivos, manipulación de cargas. Alturas: trabajo en alturas, desplome de estructura. Mecánico: movimiento de partes y maquinaria, equipos. Físico: iluminación natural/ruido por golpe a estructuras. Psicosocial: gestión organizacional, jornada extensa.',
      consecuencias: 'Fatiga, cansancio, estrés. Golpes, contusiones, traumas. Fracturas. Heridas abiertas. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Trasladarse en alturas con precaución. Calentamiento previo, evitar malas posturas. EPP completo (casco, guantes, gafas, tapa oídos). Dotación (camisa manga larga y jean). Equipos de protección contra caídas. Inspección de equipos de alturas. Trabajo en equipo, charla de comunicación asertiva. Detener la operación hasta que mejoren las condiciones ambientales.',
    },
    {
      nombre: 'Izaje de Cargas (Por Medio de Ayuda Hidráulica PH)',
      peligros: 'Público: atropellamientos. Caída de materiales. Caída de equipos y herramientas. Biomecánico: exceso de cargas. Mal amarre de la carga. Biológico: virus, bacterias y hongos. Químico: material particulado. Físico: iluminación natural. Psicosocial: gestión organizacional, jornada extensa. Fenómenos naturales: sismos, terremotos.',
      consecuencias: 'Aplastamientos. Muerte de peatones. Golpes, contusiones, heridas, raspaduras, traumas. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Plan de izaje. Uso de señalización y demarcación de las áreas. No pasar por el área donde esté la carga suspendida. Uso de EPP. Capacitación. Formatos de permisos para trabajo en alturas. Inspección de equipos de alturas. Uso de chalecos reflectivos. Radios de comunicación.',
    },
    {
      nombre: 'Desarme en Piso de Partes de la Torre Grúa',
      peligros: 'Locativo: resbalones, tropezones, caídas. Mecánico: distribución de máquinas y equipos. Movimiento de maquinaria y vehículos. Biológico: virus, bacterias, hongos y parásitos. Químico: material particulado en el ambiente. Físico: iluminación natural, ruido. Psicosocial: gestión organizacional, jornada extensa. Fenómenos naturales: sismos.',
      consecuencias: 'Golpes, contusiones. Infección por herida abierta. Atropellamientos. Daños materiales. Pérdida auditiva. Daños visuales. Estrés laboral.',
      controles: 'Caminar con precaución. EPP completo. Uso de gafas de seguridad. Uso de protección auditiva. Trabajo en equipo, charla de comunicación asertiva. Detener la operación hasta que mejoren las condiciones ambientales.',
    },
    {
      nombre: 'Izaje de Cargas Final (Traslado en Tractor Camión)',
      peligros: 'Público: atropellamientos. Caída de materiales, equipos y herramientas. Biomecánico: exceso de cargas, sobre esfuerzo. Mecánico: mal amarre de la carga. Biológico: virus, bacterias y hongos. Físico: iluminación natural. Psicosocial: gestión organizacional, jornada extensa. Fenómenos naturales: sismos, terremotos, granizadas.',
      consecuencias: 'Aplastamientos. Muerte de peatones. Golpes, contusiones, heridas, raspaduras, traumas. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Plan de izaje. Uso adecuado de equipos de protección contra caída. Señalización y demarcación de áreas. No pasar por el área donde esté la carga suspendida. EPP completo. Capacitación. Trabajo en equipo, charla de comunicación asertiva.',
    },
    {
      nombre: 'Orden y Aseo',
      peligros: 'Locativos: pisos en diferentes niveles, terreno inestable, acceso de áreas por escaleras. Biomecánico: movimientos repetitivos. Biológico: bacterias, virus, en el entorno o por personas portadoras. Físico: ruido. Fenómenos Naturales: sismos, temblores, precipitaciones.',
      consecuencias: 'Caída a mismo y diferente nivel. Fracturas, traumatismos, golpes, atropellamiento, machucones. Estrés, ansiedad, dolores de cabeza. Golpes, fracturas, traumas, laceraciones, heridas, golpes. Muerte.',
      controles: 'Charla de seguridad. Separación de residuos. Uso adecuado de EPP.',
    },
  ],

  'ats-telescopaje': [
    {
      nombre: 'Ingreso al Área de Trabajo',
      peligros: 'Locativo: resbalones, tropezones, caídas. Mecánico: distribución de máquinas y equipos, movimiento de maquinaria y vehículos. Biológico: virus, bacterias, picaduras. Químico: material particulado. Físico: iluminación natural, ruido. Psicosocial: gestión organizacional, jornada extensa. Fenómenos Naturales: sismos, terremotos, granizadas.',
      consecuencias: 'Golpes, contusiones, raspaduras. Infección por herida abierta. Atropellamientos. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Caminar con precaución. Uso de senderos peatonales. Atención a señalización. Orientar al personal sobre los riesgos. Supervisión SSTA.',
    },
    {
      nombre: 'Cargue y Descargue de Equipos y Herramientas Previo al Ascenso',
      peligros: 'Locativo: superficies irregulares, obstáculos en los sitios de trabajo. Biomecánico: posturas sostenidas, manipulación de cargas, movimientos forzados. Físico: exposición a ruido, radiación solar. Químico: material particulado. Biológico: virus, bacterias. Fenómenos naturales: sismo.',
      consecuencias: 'Golpes, traumas, contusiones. Machucones. Raspaduras. Fracturas. Heridas abiertas. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'EPP completo (guantes, casco, botas punteras, camisa manga larga, jean). Precaución durante la actividad. Ayuda entre compañeros.',
    },
    {
      nombre: 'Ascenso con Equipos de Protección Contra Caídas (Arnés, Arrestador y Eslinga en Y con Absorbedor)',
      peligros: 'Locativo: caída de equipos, herramientas y personas, caída de materiales. Biomecánico: sobre esfuerzo, movimientos repetitivos. Alturas: trabajo en alturas, desplome de estructura. Biológico: virus, bacterias, hongos. Químico: material particulado. Físico: iluminación natural, ruido. Fenómenos naturales: sismos, terremotos, granizadas.',
      consecuencias: 'Fatiga, cansancio, estrés. Golpes, contusiones, traumas. Fracturas. Quemaduras por el sol. Heridas abiertas. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'EPP completo (casco, guantes, gafas, tapa oídos). Dotación (camisa manga larga, jean). Equipos de protección contra caídas. Inspección de equipos de alturas. Pausas. Charla de seguridad. Conocimiento de procedimientos en alturas. Bloqueador solar.',
    },
    {
      nombre: 'Verificación del Cable de Poder y Elevación',
      peligros: 'Locativo: caída de equipos, herramientas y personas. Biomecánico: sobre esfuerzo, movimientos repetitivos. Alturas: trabajo en alturas, desplome de estructura. Biológico: virus, bacterias, hongos. Químico: material particulado. Físico: iluminación natural, ruido. Riesgo eléctrico: electrocución, quemaduras por contacto, caídas y golpes. Fenómenos naturales: sismos, granizadas.',
      consecuencias: 'Fatiga, cansancio, estrés. Golpes, contusiones, traumas. Fracturas. Heridas abiertas. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Trasladarse en alturas con precaución. EPP completo (casco, guantes, gafas, tapa oídos). Dotación completa. Equipos de protección contra caídas. Inspección de equipos de alturas. Trabajo en equipo, charla de comunicación asertiva. Detener la operación hasta que mejoren las condiciones ambientales.',
    },
    {
      nombre: 'Instalación de la Camisa de Telescopaje — Gato Hidráulico Bomba',
      peligros: 'Público: atropellamientos. Caída de materiales, equipos y herramientas. Biomecánico: exceso de cargas. Mal amarre de carga. Biológico: virus, bacterias, hongos. Químico: material particulado. Físico: iluminación natural, ruido. Psicosocial: gestión organizacional, jornada extensa. Fenómenos naturales: sismos.',
      consecuencias: 'Aplastamientos. Muerte de peatones. Golpes, contusiones, heridas, raspaduras, traumas. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Realizar permiso izaje de cargas. Control de tránsito con paletas. Demarcación del área y control de pasos peatonales. Calentamiento previo, evitar malas posturas. EPP completo. Botas antideslizantes con puntera. Inspección de equipos de alturas. Capacitación.',
    },
    {
      nombre: 'Izaje de Cargas',
      peligros: 'Locativo: resbalones, tropezones, caídas. Mecánico: distribución de máquinas y equipos, movimiento de maquinaria y vehículos. Biológico: virus, bacterias, hongos. Químico: material particulado. Físico: iluminación natural, ruido. Psicosocial: gestión organizacional, jornada extensa. Fenómenos naturales: sismos, terremotos.',
      consecuencias: 'Golpes, contusiones, raspaduras. Infección por herida abierta. Atropellamientos. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Caminar con precaución. EPP completo, en buen estado. Atención a señalización y señales de tránsito. Controlar el tráfico con paletas. EPP adecuado. Charla de comunicación asertiva. Detener operación hasta que mejoren condiciones ambientales.',
    },
    {
      nombre: 'Equilibrio en el Telescopaje',
      peligros: 'RIESGO FÍSICO: Ruido por impactos permanentes y/o continuos, iluminación, exceso o falta de ella. Vibración por golpe a estructuras metálicas. Movimiento de la estructura por el viento. RIESGOS BIOMECÁNICOS: Posturas prolongadas, mantenidas, forzadas. Sobre-esfuerzo. Movimientos repetitivos. Manipulación manual de cargas. RIESGOS POR CONDICIONES DE SEGURIDAD: Desplome de estructura, uso de herramientas, equipos, piezas a trabajar. Superficies irregulares. Caída de objetos a diferente nivel. FENÓMENOS NATURALES: sismos, vendavales, precipitaciones. RIESGO PSICOSOCIAL: jornadas extensas, carga mental, condiciones de la tarea.',
      consecuencias: 'Aplastamientos. Muerte de peatones. Golpes, contusiones, heridas, raspaduras, traumas. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Plan de izaje. Uso adecuado de los equipos de protección contra caída. No pasar por el área donde está la carga suspendida. Uso de gafas de seguridad. Uso de EPP: protección auditiva. Trabajo en equipo, charla de comunicación asertiva. Detener la operación hasta que mejoren las condiciones ambientales.',
    },
    {
      nombre: 'Descenso con Equipos de Protección Contra Caídas (Arnés, Arrestador y Eslinga en Y con Absorbedor)',
      peligros: 'RIESGO FÍSICO: Ruido por impactos permanentes y/o continuos, iluminación. Vibración por golpe a estructuras metálicas. Movimiento de la estructura por el viento. RIESGOS BIOMECÁNICOS: Posturas prolongadas, mantenidas, forzadas. Sobre-esfuerzo. Movimientos repetitivos. RIESGOS POR CONDICIONES DE SEGURIDAD: Desplome de estructura. Superficies irregulares. Caída de objetos, Trabajos en Alturas. FENÓMENOS NATURALES: sismos, vendavales. RIESGO PSICOSOCIAL: características de las condiciones de trabajo, jornadas extensas, carga mental.',
      consecuencias: 'Golpes, traumas, contusiones. Machucones con equipos. Raspaduras. Atrapamientos. Fracturas. Heridas abiertas. Quemaduras por el sol. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Uso adecuado de Elementos de Protección Personal y Equipos de Protección Contra Caídas. Precaución durante la actividad. Firma de permisos para trabajo en alturas.',
    },
    {
      nombre: 'Orden y Aseo',
      peligros: 'Locativos: pisos en diferentes niveles, terreno inestable. Biomecánico: movimientos repetitivos. Biológico: bacterias, virus. Físico: ruido, iluminación deficiente. Fenómenos Naturales: sismos, temblores, precipitaciones.',
      consecuencias: 'Caída a mismo y diferente nivel. Estrés, ansiedad, dolores de cabeza, depresión. Desagano, disminución de la energía. Golpes, fracturas, traumatismos, machucones, laceraciones, heridas, golpes. Muerte.',
      controles: 'Charla de seguridad. Separación de residuos. Uso adecuado de EPP.',
    },
  ],

  'ats-mantenimiento': [
    {
      nombre: 'Ingreso al Área de Trabajo (Alistamiento de Equipos, Herramientas, EPCC)',
      peligros: 'Locativo: resbalones, tropezones, caídas. Mecánico: distribución de máquinas y equipos, movimiento de maquinaria y vehículos. Biológico: virus, bacterias, picaduras. Químico: material particulado en el ambiente. Físico: iluminación natural, ruido. Psicosocial: gestión organizacional, jornada extensa. Fenómenos Naturales: sismos, terremotos, granizadas.',
      consecuencias: 'Golpes, contusiones, raspaduras. Infección por herida abierta. Atropellamientos. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Caminar con precaución. Uso de senderos peatonales. Atención a señalización y respetar señales de tránsito. Uso de EPP. Capacitación, inducción de ingreso. Trabajo en equipo. Supervisión SSTA.',
    },
    {
      nombre: 'Ascenso a la Torre Grúa con Equipos de Protección Contra Caídas',
      peligros: 'Locativo: caída de equipos, herramientas y personas. Biomecánico: sobre esfuerzo, movimientos repetitivos. Alturas: trabajo en alturas, desplome de estructura. Biológico: virus, bacterias, hongos y parásitos. Químico: material particulado. Físico: iluminación natural, ruido. Fenómenos naturales: sismos, terremotos, granizadas.',
      consecuencias: 'Fatiga, cansancio, estrés. Golpes, contusiones, traumas. Fracturas. Heridas abiertas. Quemaduras por el sol. Pérdida auditiva. Daños visuales. Muerte.',
      controles: 'EPP completo (guantes, botas punteras, camisa manga larga, jean). Inspección EPCC. Precaución durante la actividad. Ayuda entre compañeros. Ayudas mecánicas.',
    },
    {
      nombre: 'Mantenimiento General de Torre Grúa y/o Elevador (Revisión de guayas, pasadores, pines, motores, reductores, tableros eléctricos, engrase)',
      peligros: 'Físico: Ruido por actividades alrededor, radiaciones solares. Biomecánico: presencia de material particulado, manipulación de grasa y aceites hidráulicos, movimientos repetitivos, posturas incómodas, posturas sostenidas. Mecánico: Uso de ganchos y hebillas de EPCC, uso de herramientas manuales. Locativo: superficies irregulares. Alturas: trabajo en alturas, desplome de estructura. Biológico: virus, bacterias, infecciones, mordeduras. Psicosocial: condiciones de la tarea.',
      consecuencias: 'Sensibilidad auditiva, quemaduras del sol, lesiones oculares. Molestias respiratorias, alergias. Lesiones osteomusculares. Golpes, machucones, lesiones en manos y dedos. Atrapamientos. Caídas a diferente nivel. Accidentes fatales. Gripes, enfermedades infectocontagiosas. Estrés, dolor de cabeza.',
      controles: 'Uso correspondiente de EPCC: eslinga en Y, arnés cuerpo completo, línea de vida y arrestador de caídas. Uso de EPP adecuados: casco con barbuquejo, gafas, tapa oídos, guantes de posicionamiento, botas de seguridad. Inspección preoperacional de EPCC y EPPs. Precaución en el ascenso de la torre grúa. Inspección continua con operador TG. Reportar cualquier condición insegura detectada. Señalización de obra.',
    },
    {
      nombre: 'Verificación Eléctrica y Mecánica del Equipo de Elevación',
      peligros: 'Físico: Ruido por actividades alrededor, radiaciones solares. Biomecánico: movimientos repetitivos, posturas incómodas, posturas sostenidas. Mecánico: uso de herramientas de mano, maceta, pinzas eléctricas. Locativo: superficies irregulares. Alturas: trabajo en alturas. Eléctrico: revisión de cables eléctricos. Fenómenos naturales: sismo, tormentas, vendavales. Biológico: bacterias, virus, infecciones, mordeduras. Psicosocial: condiciones de la tarea.',
      consecuencias: 'Sensibilidad auditiva, quemaduras del sol, lesiones oculares. Molestias respiratorias, alergias. Lesiones osteomusculares. Golpes en manos y dedos, machucones. Caídas a diferente nivel. Accidentes fatales. Cortos eléctricos, electrocución. Gripes, enfermedades infecto contagiosas. Estrés, dolor de cabeza.',
      controles: 'Uso correspondiente de EPCC: eslinga en Y, arnés cuerpo completo, línea de vida y arrestador de caídas. Uso de EPP adecuados: casco con barbuquejo, gafas, tapa oídos, guantes. Inspección preoperacional de EPCC y EPPs. Precaución en el ascenso. Inspección continua con operador TG. Reportar cualquier condición insegura. Señalización de obra.',
    },
    {
      nombre: 'Descenso de Torre Grúa, Recolección de Herramientas y EPCC',
      peligros: 'Locativo: superficies irregulares, obstáculos, pisos húmedos. Químico: presencia de material particulado. Biológico: presencia de animales. Fenómenos naturales: sismo, vendavales, precipitaciones. Mecánico: uso de ganchos y hebillas de EPCC.',
      consecuencias: 'Caídas al mismo nivel, contusiones, esguinces. Fracturas, quemaduras del sol. Picaduras, mordeduras. Propias de un evento natural. Lesión de manos y dedos, machucones.',
      controles: 'Caminar con precaución. Uso de senderos peatonales. Orientar al personal sobre los riesgos en el área. Uso de EPP. Uso correspondiente de EPPs.',
    },
    {
      nombre: 'Orden y Aseo',
      peligros: 'Locativos: pisos en diferentes niveles, terreno inestable. Biomecánico: movimientos repetitivos. Biológico: bacterias, virus. Físico: ruido, iluminación deficiente. Fenómenos Naturales: sismos, temblores, precipitaciones.',
      consecuencias: 'Caída a mismo y diferente nivel. Fracturas, traumatismos, golpes, politraumatismos. Estrés, ansiedad, dolores de cabeza. Golpes, fracturas, traumas, laceraciones, heridas. Muerte.',
      controles: 'Charla de seguridad. Separación de residuos. Uso adecuado de EPP.',
    },
  ],

  'ats-elevador': [
    {
      nombre: 'Ingreso al Área de Trabajo (Elevador de Carga)',
      peligros: 'Locativo: resbalones, tropezones, caídas. Mecánico: distribución de máquinas y equipos, movimiento de maquinaria y vehículos. Biológico: virus, bacterias, picaduras. Químico: material particulado. Físico: iluminación natural, ruido. Psicosocial: gestión organizacional, jornada extensa. Fenómenos Naturales: sismos, terremotos, granizadas.',
      consecuencias: 'Golpes, contusiones, raspaduras. Infección por herida abierta. Atropellamientos. Pérdida auditiva. Daños visuales. Estrés laboral. Muerte por fenómenos naturales.',
      controles: 'Caminar con precaución. Uso de senderos peatonales. Atención a señalización y respetar señales de tránsito. Uso de EPP. Capacitación, inducción de ingreso. Trabajo en equipo, charla de comunicación asertiva. Supervisión SSTA.',
    },
    {
      nombre: 'Operación de Elevador de Carga',
      peligros: 'BIOLÓGICO: Virus, Bacterias, picaduras, mordeduras, rickettsias, fluidos o picaduras. RIESGO FÍSICO: Ruido por impactos permanentes y/o continuos. Iluminación, exceso o falta de ella. Vibración por golpe a estructuras metálicas. Movimiento de la estructura por el viento. LOCATIVO: Caída herramientas, caída de personas, caída de materiales. QUÍMICO: Presencia de Material particulado. BIOMECÁNICOS: Posturas prolongadas, mantenidas, forzadas. Sobre-esfuerzo. Movimientos repetitivos. CONDICIONES DE SEGURIDAD: Desplome de estructura. Mecánico: maquinaria en movimiento, uso de herramientas, material proyectado. ALTURAS: Trabajo en altura. FENÓMENOS NATURALES: sismos, vendavales, precipitaciones. RIESGO PSICOSOCIAL: jornadas extensas, carga mental.',
      consecuencias: 'Enfermedades infecciosas transmitidas por picaduras, rasguños, heridas abiertas. Malestares, estrés, trastornos de sueño. Pérdida de la atención, dificultad al comunicarse. Accidentes laborales, ansiedad, nervios, cansancio. Dolores abdominales, problemas de equilibrio. Lesiones en la frecuencia cardíaca, fatiga visual. Traumatismos en la columna vertical. Problemas de equilibrio, dolores de cabeza. Enfermedades contagiosas. Atropellamiento con vehículos. Desplome de estructura. Muerte.',
      controles: 'Diligenciamiento de permisos diariamente. Verificación listas de chequeo. Capacitación. Uso adecuado de EPP (casco, guantes, gafas, tapa oídos). Dotación (camisa manga larga y jean). Inspección diaria del equipo. Inspección de seguridad y equipos. Pausas durante la actividad.',
    },
    {
      nombre: 'Orden y Aseo',
      peligros: 'Locativos: pisos en diferentes niveles, rampas, terreno inestable. Biomecánico: movimientos repetitivos. Biológico: bacterias, virus. Físico: ruido, iluminación deficiente. Fenómenos Naturales: sismos, temblores, precipitaciones.',
      consecuencias: 'Caída a mismo y diferente nivel. Fracturas, traumatismos, golpes, atropellamiento. Estrés, ansiedad, dolores de cabeza. Golpes, fracturas, traumas, laceraciones, heridas. Muerte.',
      controles: 'Charla de seguridad. Separación de residuos. Uso adecuado de EPP.',
    },
  ],
};

/** Construye las secciones gamificadas para un ATS dado */
function buildAtsSections(worldId) {
  const pasos = ATS_PASOS[worldId] || [];

  const seccionesComunes = [
    {
      id: 'riesgos-fisicos-electricos',
      name: 'Riesgos Físicos y Eléctricos',
      enableTimer: false,
      questions: [
        {
          id: 'riesgos_fisicos_electricos',
          fieldName: 'riesgos_fisicos_electricos',
          type: 'multiselect',
          question: 'Selecciona los riesgos físicos y eléctricos presentes en la actividad:',
          icon: '⚡',
          options: [
            { value: 'radiacion_solar',          label: 'Radiación Solar' },
            { value: 'ruido',                    label: 'Ruido' },
            { value: 'alta_tension',             label: 'Alta Tensión' },
            { value: 'radiacion_ionizante',      label: 'Radiación Ionizante' },
            { value: 'vibraciones',              label: 'Vibraciones' },
            { value: 'electricidad_estatica',    label: 'Electricidad Estática' },
            { value: 'tormentas_electricas',     label: 'Tormentas Eléctricas' },
            { value: 'iluminacion_deficiente',   label: 'Iluminación Deficiente' },
            { value: 'baja_tension',             label: 'Baja Tensión' },
            { value: 'calor',                    label: 'Calor' },
            { value: 'frio_humedad',             label: 'Frío + Humedad' },
          ],
        },
      ],
    },
    {
      id: 'riesgos-quimicos-erg',
      name: 'Riesgos Químicos, Ergonómicos y Otros',
      enableTimer: false,
      questions: [
        {
          id: 'riesgos_quimicos_erg',
          fieldName: 'riesgos_quimicos_erg',
          type: 'multiselect',
          question: 'Selecciona los riesgos químicos, ergonómicos y psicosociales:',
          icon: '🧪',
          options: [
            { value: 'aerosol',                  label: 'Aerosol' },
            { value: 'polvos',                   label: 'Polvos' },
            { value: 'vapores',                  label: 'Vapores' },
            { value: 'sobre_esfuerzo',           label: 'Sobre Esfuerzo (carga)' },
            { value: 'posturas_incomodas',       label: 'Posturas Incómodas' },
            { value: 'posturas_estaticas',       label: 'Posturas Estáticas' },
            { value: 'movimientos_repetitivos',  label: 'Movimientos Repetitivos' },
            { value: 'psicosocial',              label: 'Riesgo Psicosocial' },
            { value: 'naturales',                label: 'Riesgos Naturales (sismos, vendavales)' },
          ],
        },
      ],
    },
    {
      id: 'riesgos-locativos-mec',
      name: 'Riesgos Locativos, Mecánicos y Biológicos',
      enableTimer: false,
      questions: [
        {
          id: 'riesgos_locativos_mec',
          fieldName: 'riesgos_locativos_mec',
          type: 'multiselect',
          question: 'Selecciona los riesgos locativos, mecánicos y biológicos:',
          icon: '⚠️',
          options: [
            { value: 'caida_mismo_nivel',        label: 'Caída del Mismo Nivel' },
            { value: 'caida_distinto_nivel',     label: 'Caída de Distinto Nivel' },
            { value: 'caida_objetos',            label: 'Caída de Objetos' },
            { value: 'cambio_temperatura',       label: 'Cambio de Temperatura' },
            { value: 'desprendimiento',          label: 'Desprendimiento / Derrumbe' },
            { value: 'hundimientos',             label: 'Hundimientos' },
            { value: 'atropellamiento',          label: 'Atropellamiento' },
            { value: 'golpes_machacones',        label: 'Golpes, Machacones, Trauma' },
            { value: 'atrapamientos',            label: 'Atrapamientos' },
            { value: 'mecanismos_movimiento',    label: 'Mecanismos en Movimiento' },
            { value: 'proyeccion_particulas',    label: 'Proyección de Partículas' },
            { value: 'choques',                  label: 'Choques (con/contra)' },
            { value: 'espacios_reducidos',       label: 'Espacios Reducidos' },
            { value: 'cortes_herramienta',       label: 'Cortes por Uso de Herramienta' },
            { value: 'caida_objetos_mec',        label: 'Caída de Objetos (mecánico)' },
            { value: 'bacterias_virus',          label: 'Bacterias, Virus, Hongos' },
            { value: 'picadura_insectos',        label: 'Picadura de Insectos' },
            { value: 'ofidio',                   label: 'Ofidio (serpientes)' },
            { value: 'mordedura_caninos',        label: 'Mordedura de Caninos' },
          ],
        },
      ],
    },
    {
      id: 'herramientas-ats',
      name: 'Equipos y Herramientas a Utilizar',
      enableTimer: false,
      questions: [
        { id: 'herramientas_manuales',    fieldName: 'herramientas_manuales',    type: 'text', question: 'Herramientas MANUALES a utilizar (deja vacío si no aplica):', icon: '🔨' },
        { id: 'herramientas_electricas',  fieldName: 'herramientas_electricas',  type: 'text', question: 'Herramientas ELÉCTRICAS a utilizar:', icon: '🔌' },
        { id: 'herramientas_neumaticas',  fieldName: 'herramientas_neumaticas',  type: 'text', question: 'Herramientas NEUMÁTICAS a utilizar:', icon: '💨' },
        { id: 'herramientas_hidraulicas', fieldName: 'herramientas_hidraulicas', type: 'text', question: 'Herramientas HIDRÁULICAS a utilizar:', icon: '💧' },
        { id: 'herramientas_mecanicas',   fieldName: 'herramientas_mecanicas',   type: 'text', question: 'Herramientas MECÁNICAS a utilizar (ej: Torre Grúa):', icon: '⚙️' },
        { id: 'herramientas_otras',       fieldName: 'herramientas_otras',       type: 'text', question: 'OTRAS herramientas o equipos:', icon: '🛠️' },
      ],
    },
    {
      id: 'epp-ats',
      name: 'Elementos de Protección Personal (EPP)',
      enableTimer: false,
      questions: [
        {
          id: 'epp_seleccion',
          fieldName: 'epp_seleccion',
          type: 'multiselect',
          question: 'Selecciona los elementos de protección personal a utilizar:',
          icon: '🦺',
          options: [
            { value: 'casco',                  label: 'Casco' },
            { value: 'proteccion_auditiva',    label: 'Protección Auditiva' },
            { value: 'mascarilla_polvo',       label: 'Mascarilla para Polvo' },
            { value: 'arnes_cuerpo_completo',  label: 'Arnés Cuerpo Completo' },
            { value: 'botas_seguridad',        label: 'Botas de Seguridad' },
            { value: 'guantes',                label: 'Guantes' },
            { value: 'eslinga_y_absorbente',   label: 'Eslinga en Y con Absorbente' },
            { value: 'lineas_vida',            label: 'Líneas de Vida: Horizontal y Vertical' },
            { value: 'gafas_seguridad',        label: 'Gafas de Seguridad' },
            { value: 'overol',                 label: 'Overol' },
            { value: 'arrestador_caidas',      label: 'Arrestador de Caídas' },
          ],
        },
      ],
    },
  ];

  // Secciones de pasos — una sección por cada paso del ATS
  const seccionesPasos = pasos.map((paso, i) => ({
    id: `paso-${i + 1}`,
    name: `Paso ${i + 1}`,
    enableTimer: false,
    questions: [
      {
        id: `paso_${i + 1}_confirmado`,
        fieldName: `paso_${i + 1}_confirmado`,
        type: 'yesno',
        question: `📋 ${paso.nombre}\n\n🔴 PELIGROS:\n${paso.peligros}\n\n⚡ CONSECUENCIAS:\n${paso.consecuencias}\n\n✅ CONTROLES:\n${paso.controles}\n\n¿Quedó entendido?`,
        icon: '📋',
        customOptions: [{ value: 'yes', label: 'Entendido ✓', icon: '👍' }],
      },
    ],
  }));

  return [...seccionesComunes, ...seccionesPasos];
}

// ─── Configuración de secciones y preguntas ───────────────────────────────────

const QUESTIONS_CONFIG = {

  /* ─── Hora de Ingreso ────────────────────────────────────────────── */
  'hora-ingreso': [
    {
      id:          'inicio-jornada',
      name:        'Inicio de Jornada',
      enableTimer: false,
      questions: [
        {
          id:            'confirmar_ingreso',
          type:          'yesno',
          question:      '¿Confirmas tu llegada a la obra?',
          icon:          '🕐',
          fieldName:     'confirmar_ingreso',
          customOptions: [
            { value: 'yes', label: '¡Llegué!', icon: '✓', className: 'ynq-btn--yes', negative: false },
          ],
        },
      ],
    },
  ],

  /* ─── Hora de Salida ────────────────────────────────────────────── */
  'hora-salida': [
    {
      id:          'fin-jornada',
      name:        'Fin de Jornada',
      enableTimer: false,
      questions: [
        {
          id:            'confirmar_salida',
          type:          'yesno',
          question:      'El sol cae sobre la obra… ¿Confirmas el fin de tu guardia, héroe?',
          icon:          '🌙',
          fieldName:     'confirmar_salida',
          customOptions: [
            { value: 'yes', label: '¡Descansa, héroe!', icon: '🦸', className: 'ynq-btn--yes', negative: false },
          ],
        },
      ],
    },
  ],

  /* ─── Permiso de Trabajo ─────────────────────────────────────────── */
  'permiso-trabajo': [
    {
      id:          'trabajo-general',
      name:        'Trabajo a Realizar',
      enableTimer: false,
      questions: [
        { id: 'trabajo_rutinario', type: 'yesno', question: '¿El trabajo a realizar es rutinario (repetitivo, conocido)?', icon: '🔄', critical: false, fieldName: 'trabajo_rutinario' },
        { id: 'tarea_en_alturas',  type: 'yesno', question: '¿La tarea implica trabajo en alturas (más de 1.5 m)?',        icon: '⛰️', critical: true,  fieldName: 'tarea_en_alturas'  },
      ],
    },
    {
      id:            'epp',
      name:          'EPP — Equipos de Protección Personal',
      enableTimer:   true,
      timerDuration: 90,
      questions: [
        { id: 'cuenta_certificado_alturas', type: 'yesno', question: '¿Cuenta con certificado de alturas vigente?',            icon: '📜', critical: true,  fieldName: 'cuenta_certificado_alturas' },
        { id: 'seguridad_social_arl',       type: 'yesno', question: '¿Seguridad social / ARL al día?',                        icon: '🏥', critical: true,  fieldName: 'seguridad_social_arl'       },
        { id: 'casco_tipo1',                type: 'yesno', question: '¿Casco tipo 1 con barbuquejo en buen estado?',            icon: '🪖', critical: true,  fieldName: 'casco_tipo1'                },
        { id: 'gafas',                      type: 'yesno', question: '¿Gafas de seguridad en buen estado?',                    icon: '🥽', critical: false, fieldName: 'gafas'                      },
        { id: 'proteccion_auditiva',        type: 'yesno', question: '¿Protección auditiva en buen estado?',                   icon: '👂', critical: false, fieldName: 'proteccion_auditiva'        },
        { id: 'proteccion_respiratoria',    type: 'yesno', question: '¿Protección respiratoria en buen estado?',               icon: '😷', critical: false, fieldName: 'proteccion_respiratoria'    },
        { id: 'guantes_seguridad',          type: 'yesno', question: '¿Guantes de seguridad en buen estado?',                  icon: '🧤', critical: false, fieldName: 'guantes_seguridad'          },
        { id: 'botas_dielectricas',         type: 'yesno', question: '¿Botas dieléctricas o punta de acero en buen estado?',   icon: '👢', critical: true,  fieldName: 'botas_dielectricas'         },
        { id: 'overol_dotacion',            type: 'yesno', question: '¿Overol / ropa de dotación reflectiva en buen estado?',  icon: '🦺', critical: false, fieldName: 'overol_dotacion'            },
      ],
    },
    {
      id:            'srpdc',
      name:          'SRPDC — Sistema Anticaídas',
      enableTimer:   true,
      timerDuration: 120,
      questions: [
        { id: 'arnes_cuerpo_entero',    type: 'yesno', question: '¿Arnés de cuerpo entero en buen estado (etiquetas, cintas, partes metálicas)?',        icon: '🪢', critical: true, fieldName: 'arnes_cuerpo_entero'    },
        { id: 'arnes_dielectrico',      type: 'yesno', question: '¿Arnés dieléctrico en buen estado?',                                                   icon: '⚡', critical: true, fieldName: 'arnes_dielectrico'      },
        { id: 'mosqueton',              type: 'yesno', question: '¿Mosquetón en buen estado (sin desgaste, grietas o corrosión)?',                        icon: '🔗', critical: true, fieldName: 'mosqueton'              },
        { id: 'arrestador_caidas',      type: 'yesno', question: '¿Arrestador de caídas en buen estado (freno, partes metálicas)?',                       icon: '🔒', critical: true, fieldName: 'arrestador_caidas'      },
        { id: 'eslinga_y_absorbedor',   type: 'yesno', question: '¿Eslinga en Y con absorbedor en buen estado (cintas, absorbedor, partes metálicas)?',   icon: '🪢', critical: true, fieldName: 'eslinga_y_absorbedor'   },
        { id: 'eslinga_posicionamiento',type: 'yesno', question: '¿Eslinga de posicionamiento en buen estado?',                                           icon: '🪢', critical: true, fieldName: 'eslinga_posicionamiento'},
        { id: 'linea_vida',             type: 'yesno', question: '¿Línea de vida en buen estado e instalada correctamente?',                              icon: '〰️',critical: true, fieldName: 'linea_vida'             },
        { id: 'verificacion_anclaje',   type: 'yesno', question: '¿Punto de anclaje verificado y en buen estado?',                                       icon: '⚓', critical: true, fieldName: 'verificacion_anclaje'   },
      ],
    },
    {
      id:            'precauciones',
      name:          'Precauciones Generales',
      enableTimer:   true,
      timerDuration: 120,
      questions: [
        { id: 'procedimiento_charla',           type: 'yesno', question: '¿Se realizó charla de procedimiento y socialización con el equipo de trabajo?',          icon: '💬', critical: true,  fieldName: 'procedimiento_charla'           },
        { id: 'medidas_colectivas_prevencion',  type: 'yesno', question: '¿Se implementaron medidas colectivas de prevención en el área?',                         icon: '🚧', critical: true,  fieldName: 'medidas_colectivas_prevencion'  },
        { id: 'epp_epcc_inspeccion',            type: 'yesno', question: '¿Se inspeccionó el EPP/EPCC y está en buen estado?',                                    icon: '🦺', critical: true,  fieldName: 'epp_epcc_inspeccion'            },
        { id: 'equipos_herramientas_inspeccion',type: 'yesno', question: '¿Se inspeccionaron los equipos y herramientas? ¿Están en buen estado?',                  icon: '🔧', critical: true,  fieldName: 'equipos_herramientas_inspeccion'},
        { id: 'inspeccion_sistema_ta',          type: 'yesno', question: '¿Se inspeccionó el sistema de acceso para trabajo en alturas?',                          icon: '🪜', critical: true,  fieldName: 'inspeccion_sistema_ta'          },
        { id: 'plan_emergencias_rescate',       type: 'yesno', question: '¿Existe plan de emergencias y rescate definido?',                                        icon: '🚨', critical: true,  fieldName: 'plan_emergencias_rescate'       },
        { id: 'medidas_caida_objetos',          type: 'yesno', question: '¿Se implementaron medidas para prevenir caída de objetos?',                              icon: '⚠️', critical: true,  fieldName: 'medidas_caida_objetos'          },
        { id: 'kit_rescate',                    type: 'yesno', question: '¿Se cuenta con kit de rescate disponible y operativo?',                                  icon: '🧰', critical: true,  fieldName: 'kit_rescate'                    },
        { id: 'permiso_trabajo_ats',            type: 'yesno', question: '¿Se cuenta con permiso de trabajo y ATS elaborados y aprobados?',                        icon: '📋', critical: true,  fieldName: 'permiso_trabajo_ats'            },
        { id: 'verificacion_atmosfericas',      type: 'yesno', question: '¿Se verificaron las condiciones atmosféricas antes de iniciar?',                         icon: '🌦️', critical: false, fieldName: 'verificacion_atmosfericas'      },
        { id: 'distancia_vertical_caida',       type: 'number',question: '¿Cuál es la distancia vertical de posible caída (en metros)?',                          icon: '📏', fieldName: 'distancia_vertical_caida'       },
        { id: 'otro_precausiones',              type: 'text',  question: '¿Otra precaución relevante? (escribe NA si no aplica)',                                  icon: '✍️', fieldName: 'otro_precausiones'              },
      ],
    },
    {
      id:          'equipos-acceso',
      name:        'Equipos de Acceso',
      enableTimer: false,
      questions: [
        { id: 'vertical_fija',           type: 'yesno', question: '¿Se usará escalera vertical fija?',                    icon: '🪜', critical: false, fieldName: 'vertical_fija'           },
        { id: 'vertical_portatil',       type: 'yesno', question: '¿Se usará escalera vertical portátil?',                icon: '🪜', critical: false, fieldName: 'vertical_portatil'       },
        { id: 'andamio_multidireccional',type: 'yesno', question: '¿Se usará andamio multidireccional?',                  icon: '🏗️', critical: false, fieldName: 'andamio_multidireccional'},
        { id: 'andamio_colgante',        type: 'yesno', question: '¿Se usará andamio colgante?',                          icon: '🏗️', critical: false, fieldName: 'andamio_colgante'        },
        { id: 'elevador_carga',          type: 'yesno', question: '¿Se usará elevador de carga?',                         icon: '⬆️', critical: false, fieldName: 'elevador_carga'          },
        { id: 'canastilla',              type: 'yesno', question: '¿Se usará canastilla?',                                icon: '🧺', critical: false, fieldName: 'canastilla'              },
        { id: 'ascensor_personas',       type: 'yesno', question: '¿Se usará ascensor para personas?',                   icon: '🛗', critical: false, fieldName: 'ascensor_personas'       },
        { id: 'acceso_cuerdas',          type: 'yesno', question: '¿Se usará acceso por cuerdas?',                       icon: '🪢', critical: false, fieldName: 'acceso_cuerdas'          },
        { id: 'otro_equipos',            type: 'text',  question: '¿Otro equipo de acceso? (escribe NA si no aplica)',    icon: '✍️', fieldName: 'otro_equipos'            },
      ],
    },
  ],

  /* ─── Chequeo de Alturas ─────────────────────────────────────────── */
  'chequeo-altura': [
    {
      id:          'condiciones-salud',
      name:        'Condiciones de Salud',
      enableTimer: false,
      questions: [
        { id: 'sintomas_fisicos',             type: 'yesno', question: '¿Presenta actualmente algún síntoma o malestar físico (mareo, dolor de cabeza, visión borrosa, dificultad respiratoria, etc)?',                                                  icon: '🤒', critical: true,  fieldName: 'sintomas_fisicos'             },
        { id: 'medicamento',                  type: 'yesno', question: '¿Está tomando algún medicamento que pueda afectar su estado de alerta, equilibrio, o capacidad para realizar tareas críticas?',                                                  icon: '💊', critical: true,  fieldName: 'medicamento'                  },
        { id: 'consumo_sustancias',           type: 'yesno', question: '¿Ha consumido bebidas alcohólicas o sustancias psicoactivas en las últimas 12 horas?',                                                                                           icon: '🚫', critical: true,  fieldName: 'consumo_sustancias'           },
        { id: 'condiciones_fisicas_mentales', type: 'yesno', question: '¿Se encuentra en condiciones físicas y mentales para realizar tareas que exigen altos niveles de concentración?',                                                                 icon: '💪', critical: true,  fieldName: 'condiciones_fisicas_mentales' },
      ],
    },
    {
      id:            'condiciones-seguridad',
      name:          'Condiciones de Seguridad',
      enableTimer:   true,
      timerDuration: 120,
      questions: [
        { id: 'lugar_trabajo_demarcado',           type: 'yesno', question: '¿El lugar de trabajo está demarcado/señalizado y en orden para la ejecución segura?',                                                   icon: '🚧', critical: true,  fieldName: 'lugar_trabajo_demarcado'           },
        { id: 'inspeccion_medios_comunicacion',    type: 'yesno', question: '¿Se realiza inspección pre-uso de los medios de comunicación y están en buen estado?',                                                  icon: '📻', critical: false, fieldName: 'inspeccion_medios_comunicacion'    },
        { id: 'equipo_demarcado_seguro',           type: 'yesno', question: '¿El equipo cuenta con demarcación y señalización y el ingreso es seguro?',                                                             icon: '⚠️', critical: true,  fieldName: 'equipo_demarcado_seguro'           },
        { id: 'base_libre_empozamiento',           type: 'yesno', question: '¿La base del equipo está libre de empozamiento de agua?',                                                                              icon: '💧', critical: true,  fieldName: 'base_libre_empozamiento'           },
        { id: 'iluminacion_trabajos_nocturnos',    type: 'yesno', question: '¿El equipo cuenta con iluminación adecuada para trabajos nocturnos?',                                                                  icon: '💡', critical: false, fieldName: 'iluminacion_trabajos_nocturnos'    },
        { id: 'uso_adecuado_epp_epcc',             type: 'yesno', question: '¿Se ha informado y advertido el uso adecuado del EPP/EPCC para el trabajo?',                                                          icon: '🦺', critical: true,  fieldName: 'uso_adecuado_epp_epcc'             },
        { id: 'uso_epp_trabajadores',              type: 'yesno', question: '¿Los trabajadores utilizan EPP según el factor de riesgo al que están expuestos?',                                                    icon: '👷', critical: true,  fieldName: 'uso_epp_trabajadores'              },
        { id: 'epcc_adecuado_riesgo',              type: 'yesno', question: '¿Los EPCC del personal son adecuados al riesgo del trabajo?',                                                                         icon: '🪢', critical: true,  fieldName: 'epcc_adecuado_riesgo'              },
        { id: 'interferencia_otros_trabajos',      type: 'yesno', question: '¿Existe interferencia con otro tipo de trabajos que pueda generar riesgo?',                                                           icon: '🔄', critical: true,  fieldName: 'interferencia_otros_trabajos'      },
        { id: 'observacion_continua_trabajadores', type: 'yesno', question: '¿En el desarrollo del trabajo los trabajadores autorizados son observados de forma continua?',                                        icon: '👁️', critical: true,  fieldName: 'observacion_continua_trabajadores' },
      ],
    },
    {
      id:          'acceso-anclaje',
      name:        'Sistema de Acceso y Punto de Anclaje',
      enableTimer: false,
      questions: [
        { id: 'punto_anclaje_definido',          type: 'yesno', question: '¿Se tiene definido y se garantiza el punto de anclaje y su buen estado?',                                              icon: '⚓', critical: true, fieldName: 'punto_anclaje_definido'          },
        { id: 'inspeccion_previa_sistema_acceso', type: 'yesno', question: '¿Se ha realizado una inspección previa al Sistema de Acceso para TA y se encuentra en buen estado?',                  icon: '🔍', critical: true, fieldName: 'inspeccion_previa_sistema_acceso' },
      ],
    },
    {
      id:          'izaje-cargas',
      name:        'Izaje de Cargas',
      enableTimer: false,
      questions: [
        { id: 'plan_izaje_cumple_programa', type: 'yesno', question: '¿Se cuenta con un Plan de Izaje y se cumple el Programa de izaje de cargas?',                                                                            icon: '📋', critical: true,  fieldName: 'plan_izaje_cumple_programa' },
        { id: 'inspeccion_elementos_izaje', type: 'yesno', question: '¿Se realiza inspección pre-uso de los elementos de izaje (baldes, canastas, eslingas) garantizando su buen estado?',                                     icon: '🔍', critical: true,  fieldName: 'inspeccion_elementos_izaje' },
        { id: 'limpieza_elementos_izaje',   type: 'yesno', question: '¿Los elementos de izaje se les realiza limpieza después de cada uso?',                                                                                   icon: '🧹', critical: false, fieldName: 'limpieza_elementos_izaje'   },
        { id: 'auxiliar_piso_asignado',     type: 'yesno', question: '¿Se ha asignado un auxiliar de piso (aparejador de cargas) y se garantiza el acompañamiento permanente?',                                               icon: '👷', critical: true,  fieldName: 'auxiliar_piso_asignado'     },
      ],
    },
    {
      id:            'riesgo-electrico',
      name:          'Intervención del Riesgo Eléctrico',
      enableTimer:   true,
      timerDuration: 90,
      questions: [
        { id: 'consignacion_circuito',           type: 'yesno', question: '¿Se cuenta con la consignación del circuito a intervenir?',                                                                                          icon: '📝', critical: true,  fieldName: 'consignacion_circuito'           },
        { id: 'circuitos_identificados',         type: 'yesno', question: '¿Los circuitos a trabajar han sido previamente identificados?',                                                                                      icon: '🔌', critical: true,  fieldName: 'circuitos_identificados'         },
        { id: 'cinco_reglas_oro',                type: 'yesno', question: 'Si el trabajo se realiza sin tensión, ¿está garantizada la aplicación de las cinco reglas de oro?',                                                 icon: '⚡', critical: true,  fieldName: 'cinco_reglas_oro'                },
        { id: 'trabajo_con_tension_protocolo',   type: 'yesno', question: 'Si el trabajo se realiza con tensión, ¿está garantizado el cumplimiento del protocolo de seguridad?',                                               icon: '⚡', critical: true,  fieldName: 'trabajo_con_tension_protocolo'   },
        { id: 'informacion_riesgos_trabajadores',type: 'yesno', question: '¿Se ha informado y advertido a los trabajadores los riesgos que puedan presentarse durante este trabajo?',                                          icon: '📢', critical: true,  fieldName: 'informacion_riesgos_trabajadores'},
        { id: 'distancias_minimas_seguridad',    type: 'yesno', question: '¿Están garantizadas las distancias mínimas de seguridad frente a las partes con tensión?',                                                         icon: '📏', critical: true,  fieldName: 'distancias_minimas_seguridad'    },
        { id: 'tablero_libre_elementos_riesgo',  type: 'yesno', question: '¿El(los) tablero(s) eléctrico(s) está(n) libre(s) de elementos que puedan hacer arco eléctrico?',                                                  icon: '⚠️', critical: true,  fieldName: 'tablero_libre_elementos_riesgo'  },
        { id: 'cables_en_buen_estado',           type: 'yesno', question: '¿Los cables del equipo se encuentran en buen estado?',                                                                                               icon: '🔋', critical: true,  fieldName: 'cables_en_buen_estado'           },
      ],
    },
  ],

  /* ─── Chequeo Torre Grúas ────────────────────────────────────────── */
  'chequeo-torregruas': [
    {
      id:          'seguridad-personal',
      name:        'Condiciones de Seguridad',
      enableTimer: false,
      questions: [
        { id: 'epp_personal', type: 'yesno', question: '¿Cuenta con el Equipo de Protección Personal (guantes, casco con barbuquejo, tapaoídos, gafas con filtro UV, calzado de seguridad)?', icon: '🦺', critical: true, fieldName: 'epp_personal' },
        { id: 'epp_contra_caidas', type: 'yesno', question: '¿Cuenta con el Equipo de Protección Contra Caídas (arnés completo, arrestador de caídas, mosquetones, eslinga en Y con absorbedor, eslinga de posicionamiento, línea de vida)?', icon: '🪢', critical: true, fieldName: 'epp_contra_caidas' },
        { id: 'ropa_dotacion', type: 'yesno', question: '¿Cuenta con la ropa de dotación (overol, camisa o jean)?', icon: '👕', critical: false, fieldName: 'ropa_dotacion' },
      ],
    },
    {
      id:            'controles-operacionales',
      name:          'Controles Operacionales para la Torre Grúa',
      enableTimer:   true,
      timerDuration: 120,
      questions: [
        { id: 'tornilleria_ajustada', type: 'yesno', question: '¿Se ha verificado que toda la tornillería y pasadores de las uniones estén bien ajustados?', icon: '🔩', critical: true, fieldName: 'tornilleria_ajustada' },
        { id: 'anillo_arriostrador', type: 'yesno', question: '¿Se ha verificado que el anillo arriostrador esté bien sujeto a la Torre Grúa?', icon: '⭕', critical: true, fieldName: 'anillo_arriostrador' },
        { id: 'soldaduras_buen_estado', type: 'yesno', question: '¿Se ha verificado que las soldaduras del marco y las vigas estén en buen estado?', icon: '🔧', critical: true, fieldName: 'soldaduras_buen_estado' },
        { id: 'base_buenas_condiciones', type: 'yesno', question: '¿La base de la torre grúa se encuentra en buenas condiciones, sin grietas o deformaciones?', icon: '🏗️', critical: true, fieldName: 'base_buenas_condiciones' },
        { id: 'funcionamiento_pito', type: 'yesno', question: '¿Se verificó el buen funcionamiento del pito?', icon: '📣', critical: false, fieldName: 'funcionamiento_pito' },
        { id: 'cables_alimentacion', type: 'yesno', question: '¿Se ha verificado el buen estado de los cables de alimentación eléctrica del equipo?', icon: '⚡', critical: true, fieldName: 'cables_alimentacion' },
        { id: 'movimientos_maquina', type: 'yesno', question: '¿Se probó en vacío y con velocidad lenta los movimientos de la máquina (giro, elevación y carro)?', icon: '🔄', critical: true, fieldName: 'movimientos_maquina' },
        { id: 'cables_enrollamiento', type: 'yesno', question: '¿Se ha verificado el buen estado y el enrollamiento de los cables?', icon: '🔗', critical: true, fieldName: 'cables_enrollamiento' },
        { id: 'frenos_funcionando', type: 'yesno', question: '¿Los frenos se encuentran funcionando bien?', icon: '🛑', critical: true, fieldName: 'frenos_funcionando' },
        { id: 'poleas_dinamometrica', type: 'yesno', question: '¿Se ha verificado el buen estado y funcionamiento de las poleas y el soporte de la polea dinamométrica?', icon: '⚙️', critical: true, fieldName: 'poleas_dinamometrica' },
        { id: 'gancho_seguro', type: 'yesno', question: '¿Se ha verificado el buen estado del gancho y el seguro?', icon: '🪝', critical: true, fieldName: 'gancho_seguro' },
        { id: 'punto_muerto', type: 'yesno', question: '¿Se ha verificado el buen funcionamiento del punto muerto?', icon: '🎯', critical: false, fieldName: 'punto_muerto' },
        { id: 'mando_buen_estado', type: 'yesno', question: '¿El mando se encuentra en buen estado?', icon: '🕹️', critical: false, fieldName: 'mando_buen_estado' },
      ],
    },
    {
      id:          'elementos-izaje',
      name:        'Elementos y Equipo de Izaje de Cargas',
      enableTimer: false,
      questions: [
        { id: 'baldes_buen_estado', type: 'yesno', question: '¿Los baldes de Concreto/Escombro/Tierra están en buen estado?', icon: '🪣', critical: false, fieldName: 'baldes_buen_estado' },
        { id: 'canasta_materiales', type: 'yesno', question: '¿La canasta para materiales está en buen estado?', icon: '🧺', critical: false, fieldName: 'canasta_materiales' },
        { id: 'estrobos_buen_estado', type: 'yesno', question: '¿Se ha verificado que los estrobos (guaya, reata, eslinga, cadena) se encuentran en buen estado?', icon: '🔗', critical: true, fieldName: 'estrobos_buen_estado' },
        { id: 'grilletes_buen_estado', type: 'yesno', question: '¿Los accesorios de extremos (grilletes) se encuentran en buen estado?', icon: '🔩', critical: true, fieldName: 'grilletes_buen_estado' },
        { id: 'ayudante_amarre', type: 'yesno', question: '¿Cuenta con ayudante para amarre de cargas?', icon: '👷', critical: false, fieldName: 'ayudante_amarre' },
        { id: 'radio_comunicacion', type: 'yesno', question: '¿Cuenta con radio de comunicación?', icon: '📻', critical: false, fieldName: 'radio_comunicacion' },
      ],
    },
  ],

  /* ─── Chequeo Elevador ───────────────────────────────────────────── */
  'chequeo-elevador': [
    {
      id:          'condiciones-seguridad',
      name:        'Condiciones de Seguridad',
      enableTimer: false,
      questions: [
        { id: 'epp_completo_y_en_buen_estado', type: 'yesno', question: '¿Cuenta con el Equipo de Protección Personal (guantes, casco con barbuquejo, tapaoídos, gafas con filtro UV, calzado de seguridad, ropa de dotación)?', icon: '🦺', critical: true, fieldName: 'epp_completo_y_en_buen_estado' },
        { id: 'epcc_completo_y_en_buen_estado', type: 'yesno', question: "¿Cuenta con el Equipo de Protección Contra Caídas (arnés de cuerpo completo, arrestador de caídas, mosquetones, eslinga en Y con absorbedor, eslinga de posicionamiento, línea de vida, mecanismos de anclaje)?", icon: '🪢', critical: true, fieldName: 'epcc_completo_y_en_buen_estado' },
      ],
    },
    {
      id:            'equipo-elevacion',
      name:          'Equipo de Elevación',
      enableTimer:   true,
      timerDuration: 150,
      questions: [
        { id: 'estructura_equipo_buen_estado', type: 'yesno', question: '¿Se ha verificado la estructura del equipo y se encuentra en buen estado?', icon: '🏗️', critical: true, fieldName: 'estructura_equipo_buen_estado' },
        { id: 'equipo_sin_fugas_fluido', type: 'yesno', question: '¿El equipo presenta fugas de aceites, hidráulico o de alguna otra sustancia?', icon: '💧', critical: true, fieldName: 'equipo_sin_fugas_fluido' },
        { id: 'tablero_mando_buen_estado', type: 'yesno', question: '¿El tablero de mando del equipo está en buenas condiciones?', icon: '🕹️', critical: true, fieldName: 'tablero_mando_buen_estado' },
        { id: 'puerta_acceso_buen_estado', type: 'yesno', question: '¿La puerta de acceso al equipo se encuentra en buen estado?', icon: '🚪', critical: false, fieldName: 'puerta_acceso_buen_estado' },
        { id: 'gancho_seguridad_funciona_correctamente', type: 'yesno', question: '¿El gancho de seguridad de la cabina está en buen estado y se garantiza su correcto funcionamiento?', icon: '🪝', critical: true, fieldName: 'gancho_seguridad_funciona_correctamente' },
        { id: 'plataforma_limpia_y_sin_sustancias_deslizantes', type: 'yesno', question: '¿La plataforma se encuentra limpia y libre de sustancias deslizantes?', icon: '✨', critical: true, fieldName: 'plataforma_limpia_y_sin_sustancias_deslizantes' },
        { id: 'cabina_libre_de_escombros_y_aseada', type: 'yesno', question: '¿La cabina está libre de escombros y barro (orden y aseo)?', icon: '🧹', critical: false, fieldName: 'cabina_libre_de_escombros_y_aseada' },
        { id: 'cables_electricos_y_motor_buen_estado', type: 'yesno', question: '¿Los cables del circuito eléctrico y del motor se encuentran en buen estado (sin cables sueltos ni cortos)?', icon: '⚡', critical: true, fieldName: 'cables_electricos_y_motor_buen_estado' },
        { id: 'anclajes_y_arriostramientos_bien_asegurados', type: 'yesno', question: '¿Los anclajes y/o arriostramientos se encuentran bien asegurados?', icon: '⚓', critical: true, fieldName: 'anclajes_y_arriostramientos_bien_asegurados' },
        { id: 'secciones_equipo_bien_acopladas', type: 'yesno', question: '¿Las secciones del equipo se encuentran bien acopladas?', icon: '🔗', critical: true, fieldName: 'secciones_equipo_bien_acopladas' },
        { id: 'rodillos_guia_buen_estado_y_lubricados', type: 'yesno', question: '¿Los rodillos de guía se encuentran bien lubricados y en buen estado?', icon: '⚙️', critical: false, fieldName: 'rodillos_guia_buen_estado_y_lubricados' },
        { id: 'rieles_seguridad_techo_buen_estado', type: 'yesno', question: '¿Los rieles de seguridad en el techo de la cabina están en buen estado?', icon: '🛤️', critical: false, fieldName: 'rieles_seguridad_techo_buen_estado' },
        { id: 'plataforma_trabajo_techo_buen_estado', type: 'yesno', question: '¿Cuenta con la plataforma de trabajo encima de la cabina y ésta se encuentra en buen estado?', icon: '🏗️', critical: false, fieldName: 'plataforma_trabajo_techo_buen_estado' },
        { id: 'escalera_acceso_techo_buen_estado', type: 'yesno', question: '¿La escalera de acceso al techo se encuentra en buen estado?', icon: '🪜', critical: false, fieldName: 'escalera_acceso_techo_buen_estado' },
        { id: 'freno_electromagnetico_buen_estado', type: 'yesno', question: '¿El freno eléctrico-magnético se encuentra en buen estado?', icon: '🛑', critical: true, fieldName: 'freno_electromagnetico_buen_estado' },
        { id: 'sistema_velocidad_calibrado_y_engranes_buen_estado', type: 'yesno', question: '¿El equipo cuenta con sistema de velocidad calibrado, dispositivo de reducción y piñones en buen estado y cremallera lubricada?', icon: '⚙️', critical: true, fieldName: 'sistema_velocidad_calibrado_y_engranes_buen_estado' },
        { id: 'limitantes_superior_inferior_calibrados', type: 'yesno', question: '¿Los limitantes (superior e inferior) se encuentran calibrados y se garantiza el correcto funcionamiento?', icon: '📏', critical: true, fieldName: 'limitantes_superior_inferior_calibrados' },
      ],
    },
    {
      id:          'dispositivos-seguridad',
      name:        'Dispositivos de Seguridad',
      enableTimer: false,
      questions: [
        { id: 'area_equipo_senalizada_y_demarcada', type: 'yesno', question: '¿El área del equipo se encuentra debidamente señalizada y demarcada?', icon: '⚠️', critical: true, fieldName: 'area_equipo_senalizada_y_demarcada' },
        { id: 'equipo_con_parada_emergencia', type: 'yesno', question: '¿El equipo de elevación cuenta con la parada de emergencia?', icon: '🚨', critical: true, fieldName: 'equipo_con_parada_emergencia' },
        { id: 'placa_identificacion_con_carga_maxima', type: 'yesno', question: '¿El equipo tiene la placa de identificación donde se muestra la carga máxima?', icon: '🏷️', critical: false, fieldName: 'placa_identificacion_con_carga_maxima' },
        { id: 'sistema_sobrecarga_funcional', type: 'yesno', question: '¿Se garantiza el correcto funcionamiento del sistema de sobrecarga?', icon: '⚖️', critical: true, fieldName: 'sistema_sobrecarga_funcional' },
      ],
    },
    {
      id:          'desinfeccion',
      name:        'Proceso de Desinfección de Cabina',
      enableTimer: false,
      questions: [
        { id: 'cabina_desinfectada_previamente', type: 'yesno', question: '¿La cabina ha sido previamente desinfectada antes de iniciar labores de operación?', icon: '🧴', critical: false, fieldName: 'cabina_desinfectada_previamente' },
      ],
    },
  ],

  /* ─── Inspección EPCC (Gruaman) ──────────────────────────────────── */
  'inspeccion-epcc': [
    {
      id:          'seriales-epcc',
      name:        'Equipos de Protección Contra Caídas — Seriales',
      enableTimer: false,
      questions: [
        { id: 'serial_arnes', type: 'text', question: '¿Cuál es el serial y lote del Arnés?', icon: '🏷️', fieldName: 'serial_arnes' },
        { id: 'serial_arrestador', type: 'text', question: '¿Cuál es el serial y lote del Arrestador de Caídas?', icon: '🏷️', fieldName: 'serial_arrestador' },
        { id: 'serial_mosqueton', type: 'text', question: '¿Cuál es el serial y lote del Mosquetón?', icon: '🏷️', fieldName: 'serial_mosqueton' },
        { id: 'serial_posicionamiento', type: 'text', question: '¿Cuál es el serial y lote de la Eslinga de Posicionamiento?', icon: '🏷️', fieldName: 'serial_posicionamiento' },
        { id: 'serial_eslinga_y', type: 'text', question: '¿Cuál es el serial y lote de la Eslinga en Y con Absorbedor?', icon: '🏷️', fieldName: 'serial_eslinga_y' },
        { id: 'serial_linea_vida', type: 'text', question: '¿Cuál es el serial y lote de la Línea de Vida?', icon: '🏷️', fieldName: 'serial_linea_vida' },
      ],
    },
    {
      id:            'inspeccion-equipos',
      name:          'Inspección de Equipos',
      enableTimer:   true,
      timerDuration: 90,
      questions: [
        { id: 'arnes',                type: 'yesno', question: 'ARNÉS — ¿Cuenta con etiquetas, cintas, correas, costuras, partes metálicas y partes plásticas en buen estado?',                                                 icon: '🪢', critical: true, fieldName: 'arnes'                },
        { id: 'arrestador_caidas',    type: 'yesno', question: 'ARRESTADOR DE CAÍDAS — ¿Presenta desgaste excesivo, picaduras, grietas, corrosión, deformaciones o fallas en el freno?',                                     icon: '🔒', critical: true, fieldName: 'arrestador_caidas'    },
        { id: 'mosqueton',            type: 'yesno', question: 'MOSQUETÓN — ¿Presenta desgaste excesivo, picaduras, grietas, corrosión, deformaciones o deterioro general?',                                                  icon: '🔗', critical: true, fieldName: 'mosqueton'            },
        { id: 'eslinga_posicionamiento', type: 'yesno', question: 'ESLINGA DE POSICIONAMIENTO — ¿Cuenta con cintas, correas, cuerdas y partes metálicas en buen estado?',                                                   icon: '🪢', critical: true, fieldName: 'eslinga_posicionamiento' },
        { id: 'eslinga_y_absorbedor', type: 'yesno', question: 'ESLINGA EN Y CON ABSORBEDOR — ¿Cuenta con etiquetas, absorbedor de caída, cintas, correas, costuras, partes metálicas y plásticas en buen estado?',         icon: '🪢', critical: true, fieldName: 'eslinga_y_absorbedor' },
        { id: 'linea_vida',           type: 'yesno', question: 'LÍNEA DE VIDA — ¿Cuenta con etiquetas, partes metálicas, partes plásticas, cintas y cuerdas en buen estado?',                                                icon: '〰️',critical: true, fieldName: 'linea_vida'           },
      ],
    },
  ],

  /* ─── Inspección de Izaje ────────────────────────────────────────── */
  'inspeccion-izaje': [
    {
      id:          'datos-grua',
      name:        'Datos del Equipo',
      enableTimer: false,
      questions: [
        { id: 'modelo_grua', type: 'text', question: '¿Cuál es el modelo de la grúa?', icon: '🏗️', fieldName: 'modelo_grua' },
        { id: 'altura_gancho', type: 'text', question: '¿Cuál es la altura bajo el gancho?', icon: '📏', fieldName: 'altura_gancho' },
      ],
    },
    {
      id:          'bc1',
      name:        'BC1 — Balde para Concreto 1',
      enableTimer: false,
      questions: [
        { id: 'marca_bc1', type: 'text', question: 'BC1 — Marca:', icon: '🏷️', fieldName: 'marca_bc1' },
        { id: 'serial_bc1', type: 'text', question: 'BC1 — Serial:', icon: '🏷️', fieldName: 'serial_bc1' },
        { id: 'capacidad_bc1', type: 'text', question: 'BC1 — Capacidad:', icon: '📦', fieldName: 'capacidad_bc1' },
        { id: 'sec0_preg0', type: 'yesno', question: 'BC1 — ¿Manija y ojo para izaje completos y en buen estado?', icon: '🪣', critical: true, fieldName: 'sec0_preg0' },
        { id: 'sec0_preg1', type: 'yesno', question: 'BC1 — ¿Mecanismo de apertura/cierre (manija, tapa y seguro) completo y en buen estado?', icon: '🔓', critical: true, fieldName: 'sec0_preg1' },
        { id: 'sec0_preg2', type: 'yesno', question: 'BC1 — ¿Las soldaduras se encuentran completas, sin grietas o desprendimientos?', icon: '🔧', critical: true, fieldName: 'sec0_preg2' },
        { id: 'sec0_preg3', type: 'yesno', question: 'BC1 — ¿La estructura del balde está en buen estado sin deformaciones?', icon: '🏗️', critical: true, fieldName: 'sec0_preg3' },
        { id: 'sec0_preg4', type: 'yesno', question: 'BC1 — ¿Se encuentra en buenas condiciones de aseo, libre de restos de concreto?', icon: '✨', critical: false, fieldName: 'sec0_preg4' },
      ],
    },
    {
      id:          'bc2',
      name:        'BC2 — Balde para Concreto 2',
      enableTimer: false,
      questions: [
        { id: 'marca_bc2', type: 'text', question: 'BC2 — Marca:', icon: '🏷️', fieldName: 'marca_bc2' },
        { id: 'serial_bc2', type: 'text', question: 'BC2 — Serial:', icon: '🏷️', fieldName: 'serial_bc2' },
        { id: 'capacidad_bc2', type: 'text', question: 'BC2 — Capacidad:', icon: '📦', fieldName: 'capacidad_bc2' },
        { id: 'sec1_preg0', type: 'yesno', question: 'BC2 — ¿Manija y ojo para izaje completos y en buen estado?', icon: '🪣', critical: true, fieldName: 'sec1_preg0' },
        { id: 'sec1_preg1', type: 'yesno', question: 'BC2 — ¿Mecanismo de apertura/cierre completo y en buen estado?', icon: '🔓', critical: true, fieldName: 'sec1_preg1' },
        { id: 'sec1_preg2', type: 'yesno', question: 'BC2 — ¿Las soldaduras se encuentran completas, sin grietas o desprendimientos?', icon: '🔧', critical: true, fieldName: 'sec1_preg2' },
        { id: 'sec1_preg3', type: 'yesno', question: 'BC2 — ¿La estructura del balde está en buen estado sin deformaciones?', icon: '🏗️', critical: true, fieldName: 'sec1_preg3' },
        { id: 'sec1_preg4', type: 'yesno', question: 'BC2 — ¿Se encuentra en buenas condiciones de aseo, libre de restos de concreto?', icon: '✨', critical: false, fieldName: 'sec1_preg4' },
      ],
    },
    {
      id:          'be1',
      name:        'BE1 — Balde para Escombro',
      enableTimer: false,
      questions: [
        { id: 'marca_be1', type: 'text', question: 'BE1 — Marca:', icon: '🏷️', fieldName: 'marca_be1' },
        { id: 'serial_be1', type: 'text', question: 'BE1 — Serial:', icon: '🏷️', fieldName: 'serial_be1' },
        { id: 'capacidad_be1', type: 'text', question: 'BE1 — Capacidad:', icon: '📦', fieldName: 'capacidad_be1' },
        { id: 'sec2_preg0', type: 'yesno', question: 'BE1 — ¿Manija y ojo para izaje completos y en buen estado?', icon: '🪣', critical: true, fieldName: 'sec2_preg0' },
        { id: 'sec2_preg1', type: 'yesno', question: 'BE1 — ¿Mecanismo de apertura/cierre completo y funcionando correctamente?', icon: '🔓', critical: true, fieldName: 'sec2_preg1' },
        { id: 'sec2_preg2', type: 'yesno', question: 'BE1 — ¿Las soldaduras se encuentran completas, sin grietas o desprendimientos?', icon: '🔧', critical: true, fieldName: 'sec2_preg2' },
        { id: 'sec2_preg3', type: 'yesno', question: 'BE1 — ¿La estructura del balde está en buen estado sin deformaciones?', icon: '🏗️', critical: true, fieldName: 'sec2_preg3' },
      ],
    },
    {
      id:          'cm1',
      name:        'CM1 — Canasta para Material',
      enableTimer: false,
      questions: [
        { id: 'marca_cm1', type: 'text', question: 'CM1 — Marca:', icon: '🏷️', fieldName: 'marca_cm1' },
        { id: 'serial_cm1', type: 'text', question: 'CM1 — Serial:', icon: '🏷️', fieldName: 'serial_cm1' },
        { id: 'capacidad_cm1', type: 'text', question: 'CM1 — Capacidad:', icon: '📦', fieldName: 'capacidad_cm1' },
        { id: 'sec3_preg0', type: 'yesno', question: 'CM1 — ¿Las eslingas de cadena con eslabones secundarios y principales están completas y en buen estado?', icon: '⛓️', critical: true, fieldName: 'sec3_preg0' },
        { id: 'sec3_preg1', type: 'yesno', question: 'CM1 — ¿La estructura y malla de seguridad están completas y en buenas condiciones?', icon: '🧱', critical: true, fieldName: 'sec3_preg1' },
        { id: 'sec3_preg2', type: 'yesno', question: 'CM1 — ¿Las espadas están en buenas condiciones con topes de seguridad completos?', icon: '🔒', critical: true, fieldName: 'sec3_preg2' },
        { id: 'sec3_preg3', type: 'yesno', question: 'CM1 — ¿Las soldaduras se encuentran completas, sin grietas o desprendimientos?', icon: '🔧', critical: true, fieldName: 'sec3_preg3' },
      ],
    },
    {
      id:          'ec1',
      name:        'EC1 — Eslinga de Cadena',
      enableTimer: false,
      questions: [
        { id: 'no_ec1', type: 'text', question: 'EC1 — No. de eslinga:', icon: '🏷️', fieldName: 'no_ec1' },
        { id: 'capacidad_ec1', type: 'text', question: 'EC1 — Capacidad:', icon: '📦', fieldName: 'capacidad_ec1' },
        { id: 'sec4_preg0', type: 'yesno', question: 'EC1 — ¿Los ramales con eslabones secundarios y principal están completos y en buen estado?', icon: '⛓️', critical: true, fieldName: 'sec4_preg0' },
        { id: 'sec4_preg1', type: 'yesno', question: 'EC1 — ¿Los grilletes están completos, sin deformaciones y en buen estado?', icon: '🔩', critical: true, fieldName: 'sec4_preg1' },
        { id: 'sec4_preg2', type: 'yesno', question: 'EC1 — ¿Los tornillos de grilletes están sin desgaste excesivo, completos y en buenas condiciones?', icon: '🔧', critical: true, fieldName: 'sec4_preg2' },
      ],
    },
    {
      id:          'es1-grilletes',
      name:        'ES1 — Eslinga Sintética y Grilletes',
      enableTimer: false,
      questions: [
        { id: 'serial_es1', type: 'text', question: 'ES1 — Serial:', icon: '🏷️', fieldName: 'serial_es1' },
        { id: 'capacidad_es1', type: 'text', question: 'ES1 — Capacidad:', icon: '📦', fieldName: 'capacidad_es1' },
        { id: 'sec5_preg0', type: 'yesno', question: 'ES1 — ¿El textil está en buen estado, sin signos de desgaste, decoloración o quemaduras?', icon: '🪢', critical: true, fieldName: 'sec5_preg0' },
        { id: 'sec5_preg1', type: 'yesno', question: 'ES1 — ¿Las costuras se encuentran en buen estado, no están rotas o debilitadas?', icon: '🧵', critical: true, fieldName: 'sec5_preg1' },
        { id: 'sec5_preg2', type: 'yesno', question: 'ES1 — ¿La etiqueta está en buen estado, es legible y en buenas condiciones?', icon: '🏷️', critical: false, fieldName: 'sec5_preg2' },
        { id: 'serial_grillete', type: 'text', question: 'GRILLETES — Serial:', icon: '🏷️', fieldName: 'serial_grillete' },
        { id: 'capacidad_grillete', type: 'text', question: 'GRILLETES — Capacidad:', icon: '📦', fieldName: 'capacidad_grillete' },
        { id: 'sec6_preg0', type: 'yesno', question: 'GRILLETES — ¿Cuenta con deformaciones, fisuras, corrosión o desgaste en el cuerpo del grillete?', icon: '🔩', critical: true, fieldName: 'sec6_preg0' },
        { id: 'sec6_preg1', type: 'yesno', question: 'GRILLETES — ¿Los pernos o pasadores que aseguran el grillete están en buen estado y se ajustan adecuadamente?', icon: '🔧', critical: true, fieldName: 'sec6_preg1' },
      ],
    },
  ],

  /* ─── Inspección EPCC Bomberman ──────────────────────────────────── */
  'inspeccion-epcc-bomberman': [
    {
      id:          'salud-epp',
      name:        'Condiciones de Salud, Competencia Laboral y EPP',
      enableTimer: false,
      questions: [
        { id: '0_0', type: 'yesno', question: '¿Presenta actualmente algún síntoma o malestar físico (mareo, dolor de cabeza, visión borrosa, dificultad respiratoria, etc)?', icon: '🤒', critical: true, fieldName: '0_0' },
        { id: '0_1', type: 'yesno', question: '¿Está tomando algún medicamento que pueda afectar su estado de alerta, equilibrio, o capacidad para realizar tareas críticas?', icon: '💊', critical: true, fieldName: '0_1' },
        { id: '0_2', type: 'yesno', question: '¿Ha consumido bebidas alcohólicas o sustancias psicoactivas en las últimas 12 horas?', icon: '🚫', critical: true, fieldName: '0_2' },
        { id: '0_3', type: 'yesno', question: '¿Se encuentra en condiciones físicas y mentales para realizar tareas que exigen altos niveles de concentración?', icon: '💪', critical: true, fieldName: '0_3' },
        { id: '0_4', type: 'yesno', question: '¿Cuenta con la competencia vigente para la realización de la tarea crítica?', icon: '📜', critical: true, fieldName: '0_4' },
        { id: '0_5', type: 'yesno', question: '¿Cuenta con protección de la cabeza en buen estado y acorde al tipo de exposición?', icon: '🪖', critical: true, fieldName: '0_5' },
        { id: '0_6', type: 'yesno', question: '¿Cuenta con protección auditiva en buen estado y acorde al tipo de exposición?', icon: '👂', critical: true, fieldName: '0_6' },
        { id: '0_7', type: 'yesno', question: '¿Cuenta con protección visual en buen estado y acorde al tipo de exposición?', icon: '🥽', critical: true, fieldName: '0_7' },
        { id: '0_8', type: 'yesno', question: '¿Cuenta con protección respiratoria en buen estado y acorde al tipo de exposición?', icon: '😷', critical: true, fieldName: '0_8' },
        { id: '0_9', type: 'yesno', question: '¿Cuenta con guantes de protección en buen estado y acordes al tipo de exposición?', icon: '🧤', critical: true, fieldName: '0_9' },
        { id: '0_10', type: 'yesno', question: '¿Cuenta con ropa de trabajo en buen estado y acorde al tipo de exposición?', icon: '👕', critical: true, fieldName: '0_10' },
        { id: '0_11', type: 'yesno', question: '¿Cuenta con botas de seguridad en buen estado y acordes al tipo de exposición?', icon: '👢', critical: true, fieldName: '0_11' },
        { id: '0_12', type: 'yesno', question: '¿Cuenta con otros elementos de protección en buen estado y acorde al tipo de exposición (careta, peto, mangas, polainas)?', icon: '🦺', critical: false, fieldName: '0_12' },
      ],
    },
    {
      id:            'epcc',
      name:          'EPCC — Equipos de Protección Contra Caídas',
      enableTimer:   true,
      timerDuration: 120,
      questions: [
        { id: '1_0', type: 'yesno', question: '¿La etiqueta está en buen estado (presente y completamente legible)?', icon: '🏷️', critical: true, fieldName: '1_0' },
        { id: '1_1', type: 'yesno', question: '¿Es compatible con el resto del sistema de protección contra caídas (diámetro, material y forma)?', icon: '🔗', critical: true, fieldName: '1_1' },
        { id: '1_2', type: 'yesno', question: '¿El absorbedor de impacto está en buen estado?', icon: '🛡️', critical: true, fieldName: '1_2' },
        { id: '1_3', type: 'yesno', question: '¿Las cintas o tiras están en buen estado (sin cortes, deshilachado, desgaste, quemaduras, manchas o decoloración)?', icon: '🪢', critical: true, fieldName: '1_3' },
        { id: '1_4', type: 'yesno', question: '¿Las costuras están en buen estado (sin daños ni puntadas sueltas)?', icon: '🧵', critical: true, fieldName: '1_4' },
        { id: '1_5', type: 'yesno', question: '¿Los testigos o indicadores de impacto están en buen estado?', icon: '🔍', critical: true, fieldName: '1_5' },
        { id: '1_6', type: 'yesno', question: '¿Las partes metálicas (ganchos, hebillas, aros en D, cuerpo del equipo) están en buen estado (sin corrosión, torceduras, fisuras)?', icon: '⛓️', critical: true, fieldName: '1_6' },
        { id: '1_7', type: 'yesno', question: '¿El sistema de apertura y cierre automático del seguro del equipo está en buen estado?', icon: '🔒', critical: true, fieldName: '1_7' },
        { id: '1_8', type: 'yesno', question: '¿La palanca multifuncional y sistema de auto bloqueo funcionan bien?', icon: '⚙️', critical: true, fieldName: '1_8' },
        { id: '1_9', type: 'yesno', question: '¿Las estrías de la leva de los bloqueadores están libres de daño excesivo?', icon: '🔧', critical: false, fieldName: '1_9' },
        { id: '1_10', type: 'yesno', question: '¿Las partes plásticas están en buen estado (sin ausencia, desgaste o partes sueltas/fisuradas)?', icon: '🧱', critical: false, fieldName: '1_10' },
        { id: '1_11', type: 'yesno', question: '¿El guarda cabos, funda y alma están en buen estado?', icon: '🪢', critical: true, fieldName: '1_11' },
      ],
    },
    {
      id:          'herramientas-manuales',
      name:        'Herramientas Manuales',
      enableTimer: false,
      questions: [
        { id: '2_0', type: 'yesno', question: '¿Las herramientas están libres de daños visibles?', icon: '🔨', critical: true, fieldName: '2_0' },
        { id: '2_1', type: 'yesno', question: '¿Las herramientas cuentan con mangos que permiten el fácil agarre y disminuyen el deslizamiento involuntario?', icon: '✋', critical: false, fieldName: '2_1' },
        { id: '2_2', type: 'yesno', question: '¿Las herramientas están correctamente afiladas y ajustadas, libres de fisuras, rebabas, alambres o reparaciones hechizas?', icon: '⚒️', critical: true, fieldName: '2_2' },
        { id: '2_3', type: 'yesno', question: '¿Las herramientas están diseñadas específicamente para la tarea (no son hechizas)?', icon: '🛠️', critical: true, fieldName: '2_3' },
        { id: '2_4', type: 'yesno', question: '¿Las herramientas cuentan con las dimensiones propias para la labor?', icon: '📐', critical: false, fieldName: '2_4' },
        { id: '2_5', type: 'yesno', question: '¿Las seguetas están bien acopladas al marco y las hojas están en buen estado?', icon: '🪚', critical: false, fieldName: '2_5' },
        { id: '2_6', type: 'yesno', question: '¿El tornillo de sujeción o pasador de la articulación de las pinzas/alicates/tenazas permite abrir y cerrar fácilmente?', icon: '🔧', critical: false, fieldName: '2_6' },
      ],
    },
    {
      id:            'herramientas-mecanizadas',
      name:          'Herramientas Mecanizadas',
      enableTimer:   true,
      timerDuration: 90,
      questions: [
        { id: '3_0', type: 'yesno', question: '¿Los equipos poseen aislamiento dieléctrico y su clavija se encuentra en buen estado?', icon: '⚡', critical: true, fieldName: '3_0' },
        { id: '3_1', type: 'yesno', question: '¿Se apaga el equipo antes de realizar el cambio de discos, brocas, puntas o cuchillas?', icon: '🔌', critical: true, fieldName: '3_1' },
        { id: '3_2', type: 'yesno', question: '¿Se hace uso de las llaves adecuadas para realizar el cambio de discos, brocas y cuchillas?', icon: '🔑', critical: false, fieldName: '3_2' },
        { id: '3_3', type: 'yesno', question: '¿Los discos, brocas, puntas, cuchillas y piezas clave se encuentran en buen estado?', icon: '⚙️', critical: true, fieldName: '3_3' },
        { id: '3_4', type: 'yesno', question: '¿Las RPM de la pulidora no son superiores a la capacidad del disco empleado?', icon: '🔄', critical: true, fieldName: '3_4' },
        { id: '3_5', type: 'yesno', question: '¿Los cables poseen aislamiento doble, polo a tierra y se encuentran libres de daño?', icon: '🔋', critical: true, fieldName: '3_5' },
        { id: '3_6', type: 'yesno', question: '¿Las conexiones de las mangueras neumáticas cuentan con mecanismos de seguridad (pines R y/o sistema anti látigo)?', icon: '🔗', critical: true, fieldName: '3_6' },
        { id: '3_7', type: 'yesno', question: '¿Las mangueras y los equipos en general se encuentran en buen estado y no presentan fugas?', icon: '💧', critical: true, fieldName: '3_7' },
        { id: '3_8', type: 'yesno', question: '¿Los equipos cuentan con todas sus piezas bien ajustadas (guardas de seguridad, manijas, resguardos, carcasas)?', icon: '🛡️', critical: true, fieldName: '3_8' },
        { id: '3_9', type: 'yesno', question: '¿El tubo de escape cuenta con guarda y silenciador?', icon: '🔇', critical: false, fieldName: '3_9' },
        { id: '3_10', type: 'yesno', question: '¿Las guayas y pasadores están en buen estado?', icon: '⛓️', critical: true, fieldName: '3_10' },
      ],
    },
  ],


  // Nota: 'herramientas-mantenimiento' se construye dinámicamente con buildHerramientasMantenimientoSections()
  // (necesita leer la lista de bombas cacheada en localStorage)

  // Nota: 'planilla-bombeo' NO está aquí → usa el formulario original (parseFormToQuestions retorna null)

  // ATS: generados dinámicamente por buildAtsSections(worldId)

};

// ─── Exports principales ──────────────────────────────────────────────────────

/** Mundos obligatorios — no llevan pregunta de preámbulo */
const MANDATORY_WORLDS = new Set([
  'hora-ingreso', 'permiso-trabajo', 'hora-salida',
  'ats-operacion-torregrua', 'ats-mando-inalam', 'ats-montaje-torregrua',
  'ats-montaje-elevador', 'ats-desmontaje-torregrua', 'ats-telescopaje',
  'ats-mantenimiento', 'ats-elevador',
]);

/**
 * Sección preámbulo inyectada al inicio de los mundos opcionales.
 * Si el usuario responde 'skip' → LevelWrapper marca completo y navega sin submit.
 */
const PREAMBLE_SECTION = {
  id:          '__skip_check__',
  name:        '',
  enableTimer: false,
  questions: [
    {
      id:            '__preamble__',
      type:          'yesno',
      question:      '¿Debes llenar este formulario hoy?',
      icon:          '📋',
      fieldName:     '__preamble__',
      customOptions: [
        { value: 'fill', label: 'Sí', icon: '✓', className: 'ynq-btn--yes', negative: false },
        { value: 'skip', label: 'No', icon: '✗', className: 'ynq-btn--no',  negative: false },
      ],
    },
  ],
};

/**
 * Retorna el array de secciones con preguntas para un worldId,
 * o null si ese mundo no tiene config gamificada (usa el form original).
 * Para mundos opcionales inyecta una sección preámbulo al inicio.
 */
/** Lee la lista de bombas cacheada en localStorage (guardada por herramientas_mantenimiento.jsx) */
function getCachedBombas() {
  try {
    const cached = localStorage.getItem('cached_bombas');
    if (cached) {
      return JSON.parse(cached).map(b => ({ value: b.numero_bomba, label: b.numero_bomba, icon: '🏎️' }));
    }
  } catch {}
  return [];
}

/** Construye secciones del formulario de Herramientas de Mantenimiento */
function buildHerramientasMantenimientoSections() {
  const opcionesBombas = getCachedBombas();
  return [
    {
      id: 'seleccion-bomba-herramientas',
      name: 'Seleccionar Bomba',
      questions: [
        {
          id: 'bomba_numero',
          fieldName: 'bomba_numero',
          type: opcionesBombas.length > 0 ? 'multiselect' : 'text',
          maxSelections: 1,
          minSelections: 1,
          question: '¿Cuál bomba vas a registrar?',
          icon: '🏎️',
          options: opcionesBombas,
          required: true
        }
      ]
    },
    {
      id: 'herramientas-items',
      name: 'Herramientas para Mantenimiento Básico',
      questions: [
        { id: 'copa_bristol_10mm',       fieldName: 'copa_bristol_10mm',       label: '1. COPA BRISTOL DE 10 MM',        type: 'inventory-item', required: false },
        { id: 'extension_media_x12_a',   fieldName: 'extension_media_x12_a',   label: '2. EXTENSIÓN DE 1/2 X 12"',      type: 'inventory-item', required: false },
        { id: 'palanca_media_x15',       fieldName: 'palanca_media_x15',       label: '3. PALANCA DE 1/2 X 15"',        type: 'inventory-item', required: false },
        { id: 'llave_bristol_14',        fieldName: 'llave_bristol_14',        label: '4. LLAVE BRISTOL 14',             type: 'inventory-item', required: false },
        { id: 'llave_11',                fieldName: 'llave_11',                label: '5. LLAVE 11',                     type: 'inventory-item', required: false },
        { id: 'llave_12',                fieldName: 'llave_12',                label: '6. LLAVE 12',                     type: 'inventory-item', required: false },
        { id: 'llave_13',                fieldName: 'llave_13',                label: '7. LLAVE 13',                     type: 'inventory-item', required: false },
        { id: 'llave_14',                fieldName: 'llave_14',                label: '8. LLAVE 14',                     type: 'inventory-item', required: false },
        { id: 'llave_19',                fieldName: 'llave_19',                label: '9. LLAVE 19',                     type: 'inventory-item', required: false },
        { id: 'destornillador_pala',     fieldName: 'destornillador_pala',     label: '10. DESTORNILLADOR DE PALA',      type: 'inventory-item', required: false },
        { id: 'destornillador_estrella', fieldName: 'destornillador_estrella', label: '11. DESTORNILLADOR DE ESTRELLA',  type: 'inventory-item', required: false },
        { id: 'copa_punta_10_media',     fieldName: 'copa_punta_10_media',     label: '12. COPA EN PUNTA 10 DE 1/2',    type: 'inventory-item', required: false },
        { id: 'extension_media_x12_b',   fieldName: 'extension_media_x12_b',   label: '13. EXTENSIÓN DE 1/2 X 12" (2)', type: 'inventory-item', required: false },
        { id: 'rachet_media',            fieldName: 'rachet_media',            label: '14. RACHET DE 1/2',               type: 'inventory-item', required: false },
        { id: 'llave_mixta_17',          fieldName: 'llave_mixta_17',          label: '15. LLAVE MIXTA 17',              type: 'inventory-item', required: false },
        { id: 'llave_expansiva_15',      fieldName: 'llave_expansiva_15',      label: '16. LLAVE EXPANSIVA 15"',         type: 'inventory-item', required: false },
        { id: 'observaciones', fieldName: 'observaciones', question: 'Observaciones (opcional):', label: 'Observaciones', type: 'text', required: false },
      ]
    }
  ];
}

/** Construye secciones del formulario de Kit de Lavado y Mantenimiento */
function buildKitLimpiezaSections() {
  const opcionesBombas = getCachedBombas();
  return [
    {
      id: 'seleccion-bomba-kit',
      name: 'Seleccionar Bomba',
      questions: [
        {
          id: 'bomba_numero',
          fieldName: 'bomba_numero',
          type: opcionesBombas.length > 0 ? 'multiselect' : 'text',
          maxSelections: 1,
          minSelections: 1,
          question: '¿Cuál bomba vas a registrar?',
          icon: '🏎️',
          options: opcionesBombas,
          required: true
        }
      ]
    },
    {
      id: 'kit-items',
      name: 'Kit de Lavado y Mantenimiento',
      questions: [
        { id: 'detergente_polvo',         fieldName: 'detergente_polvo',         label: '1. DETERGENTE EN POLVO',             type: 'inventory-item', required: false },
        { id: 'jabon_rey',                fieldName: 'jabon_rey',                label: '2. JABON REY',                       type: 'inventory-item', required: false },
        { id: 'espatula_flexible',        fieldName: 'espatula_flexible',        label: '3. ESPATULA FLEXIBLE',               type: 'inventory-item', required: false },
        { id: 'grasa_litio',             fieldName: 'grasa_litio',             label: '4. GRASA LITIO',                     type: 'inventory-item', required: false },
        { id: 'aceite_hidraulico',        fieldName: 'aceite_hidraulico',        label: '5. ACEITE HIDRAULICO',               type: 'inventory-item', required: false },
        { id: 'plastico_grueso',          fieldName: 'plastico_grueso',          label: '6. PLASTICO GRUESO',                 type: 'inventory-item', required: false },
        { id: 'talonario_bombeo',         fieldName: 'talonario_bombeo',         label: '7. TALONARIO DE BOMBEO',             type: 'inventory-item', required: false },
        { id: 'extintor',                 fieldName: 'extintor',                 label: '8. EXTINTOR',                        type: 'inventory-item', required: false },
        { id: 'botiquin',                 fieldName: 'botiquin',                 label: '9. BOTIQUIN',                        type: 'inventory-item', required: false },
        { id: 'grasera',                  fieldName: 'grasera',                  label: '10. GRASERA',                        type: 'inventory-item', required: false },
        { id: 'manguera_inyector_grasa',  fieldName: 'manguera_inyector_grasa',  label: '11. MANGUERA PARA INYECTOR DE GRASA', type: 'inventory-item', required: false },
        { id: 'radio',                    fieldName: 'radio',                    label: '12. RADIO',                          type: 'inventory-item', required: false },
        { id: 'auricular',                fieldName: 'auricular',                label: '13. AURICULAR',                      type: 'inventory-item', required: false },
        { id: 'pimpina_acpm',             fieldName: 'pimpina_acpm',             label: '14. PIMPINA ACPM',                   type: 'inventory-item', required: false },
        { id: 'bola_limpieza',            fieldName: 'bola_limpieza',            label: '15. BOLA DE LIMPIEZA',               type: 'inventory-item', required: false },
        { id: 'perros',                   fieldName: 'perros',                   label: '16. PERROS',                         type: 'inventory-item', required: false },
        { id: 'guaya',                    fieldName: 'guaya',                    label: '17. GUAYA',                          type: 'inventory-item', required: false },
        { id: 'observaciones', fieldName: 'observaciones', question: 'Observaciones (opcional):', label: 'Observaciones', type: 'text', required: false },
      ]
    }
  ];
}

export function parseFormToQuestions(worldId) {
  if (worldId.startsWith('ats-')) {
    const atsSections = buildAtsSections(worldId);
    // Los ATS no tienen preamble (ya están en MANDATORY_WORLDS)
    return atsSections;
  }

  let sections;
  if (worldId === 'checklist') sections = buildChecklistSections();
  else if (worldId === 'herramientas-mantenimiento') sections = buildHerramientasMantenimientoSections();
  else if (worldId === 'kit-limpieza') sections = buildKitLimpiezaSections();
  else sections = QUESTIONS_CONFIG[worldId] ?? null;

  if (!sections) return null;

  // Mundos opcionales llevan pregunta "¿debes llenarlo hoy?" al inicio
  if (!MANDATORY_WORLDS.has(worldId)) {
    sections = [PREAMBLE_SECTION, ...sections];
  }

  return sections;
}

// ─── Conversores al payload del backend ──────────────────────────────────────

function buildHoraIngreso() {
  const ctx = getGameContext();
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return {
    nombre_cliente:  ctx.cliente || ctx.proyecto,
    nombre_proyecto: ctx.proyecto,
    fecha_servicio:  todayStr(),
    nombre_operador: ctx.operador,
    cargo:           ctx.cargo,
    empresa_id:      Number(localStorage.getItem('empresa_id')) || 1,
    hora_ingreso:    `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    observaciones:   '',
  };
}

function buildHoraSalida() {
  const ctx = getGameContext();
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return {
    nombre_cliente:  ctx.cliente || ctx.proyecto,
    nombre_proyecto: ctx.proyecto,
    fecha_servicio:  todayStr(),
    nombre_operador: ctx.operador,
    cargo:           ctx.cargo,
    empresa_id:      Number(localStorage.getItem('empresa_id')) || 1,
    hora_salida:     `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    observaciones:   '',
  };
}

function buildPermisoTrabajo(answers) {
  const ctx = getGameContext();
  const def = 'NA';

  return {
    nombre_cliente:  ctx.cliente || ctx.proyecto,
    nombre_proyecto: ctx.proyecto,
    fecha_servicio:  todayStr(),
    nombre_operador: ctx.operador,
    cargo:           ctx.cargo,

    trabajo_rutinario:          yn(answers['trabajo_rutinario']) || 'RUTINARIO',
    tarea_en_alturas:           yn(answers['tarea_en_alturas'])  || 'NO',
    altura_inicial:             '0',
    altura_final:               '0',
    herramientas_seleccionadas: '',
    herramientas_otros:         '',

    certificado_alturas:     yn(answers['cuenta_certificado_alturas']) || def,
    seguridad_social_arl:    yn(answers['seguridad_social_arl'])       || def,
    casco_tipo1:             yn(answers['casco_tipo1'])                || def,
    gafas_seguridad:         yn(answers['gafas'])                      || def,
    proteccion_auditiva:     yn(answers['proteccion_auditiva'])        || def,
    proteccion_respiratoria: yn(answers['proteccion_respiratoria'])    || def,
    guantes_seguridad:       yn(answers['guantes_seguridad'])          || def,
    botas_punta_acero:       yn(answers['botas_dielectricas'])         || def,
    ropa_reflectiva:         yn(answers['overol_dotacion'])            || def,

    arnes_cuerpo_entero:             yn(answers['arnes_cuerpo_entero'])     || def,
    arnes_cuerpo_entero_dielectrico: yn(answers['arnes_dielectrico'])       || def,
    mosqueton:                       yn(answers['mosqueton'])               || def,
    arrestador_caidas:               yn(answers['arrestador_caidas'])       || def,
    eslinga_absorbedor:              yn(answers['eslinga_y_absorbedor'])    || def,
    eslinga_posicionamiento:         yn(answers['eslinga_posicionamiento']) || def,
    linea_vida:                      yn(answers['linea_vida'])              || def,
    eslinga_doble:                   'NA',
    verificacion_anclaje:            yn(answers['verificacion_anclaje'])    || def,

    procedimiento_charla:            yn(answers['procedimiento_charla'])            || def,
    medidas_colectivas_prevencion:   yn(answers['medidas_colectivas_prevencion'])   || def,
    epp_epcc_buen_estado:            yn(answers['epp_epcc_inspeccion'])             || def,
    equipos_herramienta_buen_estado: yn(answers['equipos_herramientas_inspeccion']) || def,
    inspeccion_sistema:              yn(answers['inspeccion_sistema_ta'])           || def,
    plan_emergencia_rescate:         yn(answers['plan_emergencias_rescate'])        || def,
    medidas_caida:                   yn(answers['medidas_caida_objetos'])           || def,
    kit_rescate:                     yn(answers['kit_rescate'])                     || def,
    permisos:                        yn(answers['permiso_trabajo_ats'])             || def,
    condiciones_atmosfericas:        yn(answers['verificacion_atmosfericas'])       || def,
    distancia_vertical_caida:        answers['distancia_vertical_caida']            || '0',
    otro_precausiones:               answers['otro_precausiones']                   || '',

    vertical_fija:            yn(answers['vertical_fija'])            || def,
    vertical_portatil:        yn(answers['vertical_portatil'])        || def,
    andamio_multidireccional: yn(answers['andamio_multidireccional']) || def,
    andamio_colgante:         yn(answers['andamio_colgante'])         || def,
    elevador_carga:           yn(answers['elevador_carga'])           || def,
    canasta:                  yn(answers['canastilla'])               || def,
    ascensores:               yn(answers['ascensor_personas'])        || def,
    acceso_cuerdas:           yn(answers['acceso_cuerdas'])           || def,
    otro_equipos:             answers['otro_equipos']                 || '',

    observaciones:      '',
    motivo_suspension:  '',
    nombre_suspende:    '',
    nombre_responsable: '',
    nombre_coordinador: '',
  };
}

function buildChequeoAlturas(answers) {
  const ctx = getGameContext();
  return {
    nombre_cliente:  ctx.cliente || ctx.proyecto,
    nombre_proyecto: ctx.proyecto,
    fecha_servicio:  todayStr(),
    nombre_operador: ctx.operador,
    cargo:           ctx.cargo,

    sintomas_fisicos:             yn(answers['sintomas_fisicos']),
    medicamento:                  yn(answers['medicamento']),
    consumo_sustancias:           yn(answers['consumo_sustancias']),
    condiciones_fisicas_mentales: yn(answers['condiciones_fisicas_mentales']),

    lugar_trabajo_demarcado:           yn(answers['lugar_trabajo_demarcado']),
    inspeccion_medios_comunicacion:    yn(answers['inspeccion_medios_comunicacion']),
    equipo_demarcado_seguro:           yn(answers['equipo_demarcado_seguro']),
    base_libre_empozamiento:           yn(answers['base_libre_empozamiento']),
    iluminacion_trabajos_nocturnos:    yn(answers['iluminacion_trabajos_nocturnos']),
    uso_adecuado_epp_epcc:             yn(answers['uso_adecuado_epp_epcc']),
    uso_epp_trabajadores:              yn(answers['uso_epp_trabajadores']),
    epcc_adecuado_riesgo:              yn(answers['epcc_adecuado_riesgo']),
    interferencia_otros_trabajos:      yn(answers['interferencia_otros_trabajos']),
    observacion_continua_trabajadores: yn(answers['observacion_continua_trabajadores']),

    punto_anclaje_definido:           yn(answers['punto_anclaje_definido']),
    inspeccion_previa_sistema_acceso: yn(answers['inspeccion_previa_sistema_acceso']),

    plan_izaje_cumple_programa: yn(answers['plan_izaje_cumple_programa']),
    inspeccion_elementos_izaje: yn(answers['inspeccion_elementos_izaje']),
    limpieza_elementos_izaje:   yn(answers['limpieza_elementos_izaje']),
    auxiliar_piso_asignado:     yn(answers['auxiliar_piso_asignado']),

    consignacion_circuito:            yn(answers['consignacion_circuito']),
    circuitos_identificados:          yn(answers['circuitos_identificados']),
    cinco_reglas_oro:                 yn(answers['cinco_reglas_oro']),
    trabajo_con_tension_protocolo:    yn(answers['trabajo_con_tension_protocolo']),
    informacion_riesgos_trabajadores: yn(answers['informacion_riesgos_trabajadores']),
    distancias_minimas_seguridad:     yn(answers['distancias_minimas_seguridad']),
    tablero_libre_elementos_riesgo:   yn(answers['tablero_libre_elementos_riesgo']),
    cables_en_buen_estado:            yn(answers['cables_en_buen_estado']),

    observaciones: '',
  };
}

function buildChequeoTorregruas(answers) {
  const ctx = getGameContext();
  return {
    nombre_cliente:  ctx.cliente || ctx.proyecto,
    nombre_proyecto: ctx.proyecto,
    fecha_servicio:  todayStr(),
    nombre_operador: ctx.operador,
    cargo:           ctx.cargo,
    epp_personal:        yn(answers['epp_personal']),
    epp_contra_caidas:   yn(answers['epp_contra_caidas']),
    ropa_dotacion:       yn(answers['ropa_dotacion']),
    tornilleria_ajustada:    yn(answers['tornilleria_ajustada']),
    anillo_arriostrador:     yn(answers['anillo_arriostrador']),
    soldaduras_buen_estado:  yn(answers['soldaduras_buen_estado']),
    base_buenas_condiciones: yn(answers['base_buenas_condiciones']),
    funcionamiento_pito:     yn(answers['funcionamiento_pito']),
    cables_alimentacion:     yn(answers['cables_alimentacion']),
    movimientos_maquina:     yn(answers['movimientos_maquina']),
    cables_enrollamiento:    yn(answers['cables_enrollamiento']),
    frenos_funcionando:      yn(answers['frenos_funcionando']),
    poleas_dinamometrica:    yn(answers['poleas_dinamometrica']),
    gancho_seguro:           yn(answers['gancho_seguro']),
    punto_muerto:            yn(answers['punto_muerto']),
    mando_buen_estado:       yn(answers['mando_buen_estado']),
    baldes_buen_estado:   yn(answers['baldes_buen_estado']),
    canasta_materiales:   yn(answers['canasta_materiales']),
    estrobos_buen_estado: yn(answers['estrobos_buen_estado']),
    grilletes_buen_estado:yn(answers['grilletes_buen_estado']),
    ayudante_amarre:      yn(answers['ayudante_amarre']),
    radio_comunicacion:   yn(answers['radio_comunicacion']),
    observaciones: '',
  };
}

function buildChequeoElevador(answers) {
  const ctx = getGameContext();
  // Las claves de respuesta ya son los nombres de columna en BD — solo se convierten yes/no/na a SI/NO/NA
  const respuestas = {};
  Object.keys(answers).forEach(k => {
    respuestas[k] = yn(answers[k]);
  });
  return {
    nombre_cliente:  ctx.cliente || ctx.proyecto,
    nombre_proyecto: ctx.proyecto,
    fecha_servicio:  todayStr(),
    nombre_operador: ctx.operador,
    cargo:           ctx.cargo,
    ...respuestas,
    observaciones_generales: '',
  };
}

function buildInspeccionEpcc(answers) {
  const ctx = getGameContext();
  return {
    nombre_cliente:  ctx.cliente || ctx.proyecto,
    nombre_proyecto: ctx.proyecto,
    fecha_servicio:  todayStr(),
    nombre_operador: ctx.operador,
    cargo:           ctx.cargo,
    serial_arnes:          answers['serial_arnes']          || '',
    serial_arrestador:     answers['serial_arrestador']     || '',
    serial_mosqueton:      answers['serial_mosqueton']      || '',
    serial_posicionamiento:answers['serial_posicionamiento']|| '',
    serial_eslinga_y:      answers['serial_eslinga_y']      || '',
    serial_linea_vida:     answers['serial_linea_vida']     || '',
    arnes:               yn(answers['arnes']),
    arrestador_caidas:   yn(answers['arrestador_caidas']),
    mosqueton:           yn(answers['mosqueton']),
    eslinga_posicionamiento: yn(answers['eslinga_posicionamiento']),
    eslinga_y_absorbedor:    yn(answers['eslinga_y_absorbedor']),
    linea_vida:          yn(answers['linea_vida']),
    observaciones: '',
  };
}

function buildInspeccionIzaje(answers) {
  const ctx = getGameContext();
  return {
    nombre_cliente:   ctx.cliente || ctx.proyecto,
    nombre_proyecto:  ctx.proyecto,
    fecha_servicio:   todayStr(),
    nombre_operador:  ctx.operador,
    cargo:            ctx.cargo,
    modelo_grua:      answers['modelo_grua']   || '',
    altura_gancho:    answers['altura_gancho']  || '',
    marca_balde_concreto1:       answers['marca_bc1']    || '',
    serial_balde_concreto1:      answers['serial_bc1']   || '',
    capacidad_balde_concreto1:   answers['capacidad_bc1']|| '',
    balde_concreto1_buen_estado: yn(answers['sec0_preg0']),
    balde_concreto1_mecanismo_apertura: yn(answers['sec0_preg1']),
    balde_concreto1_soldadura:   yn(answers['sec0_preg2']),
    balde_concreto1_estructura:  yn(answers['sec0_preg3']),
    balde_concreto1_aseo:        yn(answers['sec0_preg4']),
    marca_balde_concreto2:       answers['marca_bc2']    || '',
    serial_balde_concreto2:      answers['serial_bc2']   || '',
    capacidad_balde_concreto2:   answers['capacidad_bc2']|| '',
    balde_concreto2_buen_estado: yn(answers['sec1_preg0']),
    balde_concreto2_mecanismo_apertura: yn(answers['sec1_preg1']),
    balde_concreto2_soldadura:   yn(answers['sec1_preg2']),
    balde_concreto2_estructura:  yn(answers['sec1_preg3']),
    balde_concreto2_aseo:        yn(answers['sec1_preg4']),
    marca_balde_escombro:        answers['marca_be1']    || '',
    serial_balde_escombro:       answers['serial_be1']   || '',
    capacidad_balde_escombro:    answers['capacidad_be1']|| '',
    balde_escombro_buen_estado:  yn(answers['sec2_preg0']),
    balde_escombro_mecanismo_apertura: yn(answers['sec2_preg1']),
    balde_escombro_soldadura:    yn(answers['sec2_preg2']),
    balde_escombro_estructura:   yn(answers['sec2_preg3']),
    marca_canasta_material:      answers['marca_cm1']    || '',
    serial_canasta_material:     answers['serial_cm1']   || '',
    capacidad_canasta_material:  answers['capacidad_cm1']|| '',
    canasta_material_buen_estado:        yn(answers['sec3_preg0']),
    canasta_material_malla_seguridad_intacta: yn(answers['sec3_preg1']),
    canasta_material_espadas:    yn(answers['sec3_preg2']),
    canasta_material_soldadura:  yn(answers['sec3_preg3']),
    numero_eslinga_cadena:       answers['no_ec1']       || '',
    capacidad_eslinga_cadena:    answers['capacidad_ec1']|| '',
    eslinga_cadena_ramales:      yn(answers['sec4_preg0']),
    eslinga_cadena_grilletes:    yn(answers['sec4_preg1']),
    eslinga_cadena_tornillos:    yn(answers['sec4_preg2']),
    serial_eslinga_sintetica:    answers['serial_es1']   || '',
    capacidad_eslinga_sintetica: answers['capacidad_es1']|| '',
    eslinga_sintetica_textil:    yn(answers['sec5_preg0']),
    eslinga_sintetica_costuras:  yn(answers['sec5_preg1']),
    eslinga_sintetica_etiquetas: yn(answers['sec5_preg2']),
    serial_grillete:             answers['serial_grillete']   || '',
    capacidad_grillete:          answers['capacidad_grillete']|| '',
    grillete_perno_danos:        yn(answers['sec6_preg0']),
    grillete_cuerpo_buen_estado: yn(answers['sec6_preg1']),
    observaciones: '',
  };
}

function buildInspeccionEpccBomberman(answers) {
  const ctx = getGameContext();

  const camposDB = [
    // Sec 0: 13 items
    'sintoma_malestar_fisico', 'uso_medicamentos_que_afecten_alerta', 'consumo_sustancias_12h',
    'condiciones_fisicas_tareas_criticas', 'competencia_vigente_tarea_critica',
    'proteccion_cabeza_buen_estado', 'proteccion_auditiva_buen_estado', 'proteccion_visual_buen_estado',
    'proteccion_respiratoria_buen_estado', 'guantes_proteccion_buen_estado', 'ropa_trabajo_buen_estado',
    'botas_seguridad_buen_estado', 'otros_epp_buen_estado',
    // Sec 1: 12 items
    'etiqueta_en_buen_estado', 'compatibilidad_sistema_proteccion', 'absorbedor_impacto_buen_estado',
    'cintas_tiras_buen_estado', 'costuras_buen_estado', 'indicadores_impacto_buen_estado',
    'partes_metalicas_buen_estado', 'sistema_cierre_automatico_buen_estado',
    'palanca_multifuncional_buen_funcionamiento', 'estrias_leva_libres_dano',
    'partes_plasticas_buen_estado', 'guarda_cabos_funda_alma_buen_estado',
    // Sec 2: 7 items
    'herramientas_libres_danos_visibles', 'mangos_facil_agarre', 'herramientas_afiladas_ajustadas',
    'herramientas_disenadas_tarea', 'herramientas_dimensiones_correctas',
    'seguetas_bien_acopladas', 'pinzas_buen_funcionamiento',
    // Sec 3: 11 items
    'aislamiento_dieletrico_buen_estado', 'apaga_equipo_para_cambio_discos',
    'uso_llaves_adecuadas_cambio_discos', 'discos_brocas_puntas_buen_estado',
    'rpm_no_supera_capacidad_disco', 'cables_aislamiento_doble_buen_estado',
    'conexiones_neumaticas_seguras', 'mangueras_y_equipos_sin_fugas',
    'piezas_ajustadas_correctamente', 'tubo_escape_con_guarda_silenciador', 'guayas_pasadores_buen_estado',
  ];

  const seccionSizes = [13, 12, 7, 11];
  const campos = {};
  let idx = 0;
  seccionSizes.forEach((size, secIdx) => {
    for (let itemIdx = 0; itemIdx < size; itemIdx++) {
      const key = `${secIdx}_${itemIdx}`;
      campos[camposDB[idx]] = yn(answers[key]);
      idx++;
    }
  });

  return {
    nombre_cliente:  ctx.cliente || ctx.proyecto,
    nombre_proyecto: ctx.proyecto,
    fecha_servicio:  todayStr(),
    nombre_operador: ctx.operador,
    cargo:           ctx.cargo,
    ...campos,
    observaciones_generales: '',
  };
}

function buildChecklist(answers) {
  const ctx = getGameContext();

  const checklistPayload = {};
  CHECKLIST_ITEM_FIELDS.forEach(field => {
    if (field in CHECKLIST_CAMPOS_EN_DATOS) {
      const tipo = CHECKLIST_CAMPOS_EN_DATOS[field];
      const v = answers[field];
      const vacio = v === undefined || v === null || v === '';
      if (tipo === 'number') {
        const n = Number(v);
        checklistPayload[field] = vacio ? null : (isNaN(n) ? null : n);
      } else if (tipo === 'date') {
        checklistPayload[field] = vacio ? null : (v || null);
      } else {
        checklistPayload[field] = vacio ? '' : String(v);
      }
    } else {
      const val = answers[field];
      // Los valores ahora son directamente BUENO/MALO/REGULAR/SI/NO/etc.
      checklistPayload[field] = val !== undefined
        ? val
        : (CHECKLIST_FIELD_OPTIONS[field] ? CHECKLIST_FIELD_OPTIONS[field][0] : 'BUENO');
      // Observación capturada por YesNoQuestion cuando la respuesta es negativa
      checklistPayload[`${field}_observacion`] = answers[`${field}_obs`] || '';
    }
  });

  return {
    nombre_cliente:  ctx.cliente || ctx.proyecto,
    nombre_proyecto: ctx.proyecto,
    fecha_servicio:  todayStr(),
    nombre_operador: ctx.operador,
    bomba_numero:    answers['bomba_numero']    || '',
    horometro_motor: answers['horometro_motor'] || '',
    observaciones:   '',
    ...checklistPayload,
  };
}

/**
 * Convierte las respuestas gamificadas al payload original del backend.
 */
function buildAts(answers, tipoAts) {
  const ctx = getGameContext();

  const has = (arr, val) => Array.isArray(arr) ? arr.includes(val) : false;

  const fisElec = answers['riesgos_fisicos_electricos'] || [];
  const quimErg = answers['riesgos_quimicos_erg']       || [];
  const locMec  = answers['riesgos_locativos_mec']      || [];
  const epp     = answers['epp_seleccion']              || [];

  return {
    tipo_ats:           tipoAts,
    fecha_elaboracion:  todayStr(),
    lugar_obra:         ctx.proyecto || '',
    valido_desde:       todayStr(),
    valido_hasta:       todayStr(),
    contratista:        ctx.cliente  || 'N/A',
    nombre_operador:    ctx.operador,
    cargo:              ctx.cargo,

    // Riesgos físicos/eléctricos
    riesgo_radiacion_solar:        has(fisElec, 'radiacion_solar'),
    riesgo_ruido:                  has(fisElec, 'ruido'),
    riesgo_alta_tension:           has(fisElec, 'alta_tension'),
    riesgo_radiacion_ionizante:    has(fisElec, 'radiacion_ionizante'),
    riesgo_vibraciones:            has(fisElec, 'vibraciones'),
    riesgo_electricidad_estatica:  has(fisElec, 'electricidad_estatica'),
    riesgo_tormentas_electricas:   has(fisElec, 'tormentas_electricas'),
    riesgo_iluminacion_deficiente: has(fisElec, 'iluminacion_deficiente'),
    riesgo_baja_tension:           has(fisElec, 'baja_tension'),
    riesgo_calor:                  has(fisElec, 'calor'),
    riesgo_frio_humedad:           has(fisElec, 'frio_humedad'),

    // Riesgos químicos/ergonómicos/otros
    riesgo_aerosol:                 has(quimErg, 'aerosol'),
    riesgo_polvos:                  has(quimErg, 'polvos'),
    riesgo_vapores:                 has(quimErg, 'vapores'),
    riesgo_sobre_esfuerzo:          has(quimErg, 'sobre_esfuerzo'),
    riesgo_posturas_incomodas:      has(quimErg, 'posturas_incomodas'),
    riesgo_posturas_estaticas:      has(quimErg, 'posturas_estaticas'),
    riesgo_movimientos_repetitivos: has(quimErg, 'movimientos_repetitivos'),
    riesgo_psicosocial:             has(quimErg, 'psicosocial'),
    riesgo_naturales:               has(quimErg, 'naturales'),

    // Riesgos locativos/mecánicos/biológicos
    riesgo_caida_mismo_nivel:      has(locMec, 'caida_mismo_nivel'),
    riesgo_caida_distinto_nivel:   has(locMec, 'caida_distinto_nivel'),
    riesgo_caida_objetos:          has(locMec, 'caida_objetos'),
    riesgo_cambio_temperatura:     has(locMec, 'cambio_temperatura'),
    riesgo_desprendimiento:        has(locMec, 'desprendimiento'),
    riesgo_hundimientos:           has(locMec, 'hundimientos'),
    riesgo_atropellamiento:        has(locMec, 'atropellamiento'),
    riesgo_golpes_machacones:      has(locMec, 'golpes_machacones'),
    riesgo_atrapamientos:          has(locMec, 'atrapamientos'),
    riesgo_mecanismos_movimiento:  has(locMec, 'mecanismos_movimiento'),
    riesgo_proyeccion_particulas:  has(locMec, 'proyeccion_particulas'),
    riesgo_choques:                has(locMec, 'choques'),
    riesgo_espacios_reducidos:     has(locMec, 'espacios_reducidos'),
    riesgo_cortes_herramienta:     has(locMec, 'cortes_herramienta'),
    riesgo_caida_objetos_mec:      has(locMec, 'caida_objetos_mec'),
    riesgo_bacterias_virus:        has(locMec, 'bacterias_virus'),
    riesgo_picadura_insectos:      has(locMec, 'picadura_insectos'),
    riesgo_ofidio:                 has(locMec, 'ofidio'),
    riesgo_mordedura_caninos:      has(locMec, 'mordedura_caninos'),

    // Herramientas
    herramientas_manuales:    answers['herramientas_manuales']    || '',
    herramientas_electricas:  answers['herramientas_electricas']  || '',
    herramientas_neumaticas:  answers['herramientas_neumaticas']  || '',
    herramientas_hidraulicas: answers['herramientas_hidraulicas'] || '',
    herramientas_mecanicas:   answers['herramientas_mecanicas']   || '',
    herramientas_otras:       answers['herramientas_otras']       || '',

    // EPP
    epp_casco:                 has(epp, 'casco'),
    epp_proteccion_auditiva:   has(epp, 'proteccion_auditiva'),
    epp_mascarilla_polvo:      has(epp, 'mascarilla_polvo'),
    epp_arnes_cuerpo_completo: has(epp, 'arnes_cuerpo_completo'),
    epp_botas_seguridad:       has(epp, 'botas_seguridad'),
    epp_guantes:               has(epp, 'guantes'),
    epp_eslinga_y_absorbente:  has(epp, 'eslinga_y_absorbente'),
    epp_lineas_vida:           has(epp, 'lineas_vida'),
    epp_gafas_seguridad:       has(epp, 'gafas_seguridad'),
    epp_overol:                has(epp, 'overol'),
    epp_arrestador_caidas:     has(epp, 'arrestador_caidas'),

    // Pasos confirmados (hasta 9)
    paso_1_confirmado: answers['paso_1_confirmado'] === 'yes',
    paso_2_confirmado: answers['paso_2_confirmado'] === 'yes',
    paso_3_confirmado: answers['paso_3_confirmado'] === 'yes',
    paso_4_confirmado: answers['paso_4_confirmado'] === 'yes',
    paso_5_confirmado: answers['paso_5_confirmado'] === 'yes',
    paso_6_confirmado: answers['paso_6_confirmado'] === 'yes',
    paso_7_confirmado: answers['paso_7_confirmado'] === 'yes',
    paso_8_confirmado: answers['paso_8_confirmado'] === 'yes',
    paso_9_confirmado: answers['paso_9_confirmado'] === 'yes',
  };
}

export function convertAnswersToFormData(worldId, answers) {
  if (worldId === 'hora-ingreso')             return buildHoraIngreso();
  if (worldId === 'hora-salida')              return buildHoraSalida();
  if (worldId === 'permiso-trabajo')          return buildPermisoTrabajo(answers);
  if (worldId === 'chequeo-altura')           return buildChequeoAlturas(answers);
  if (worldId === 'chequeo-torregruas')       return buildChequeoTorregruas(answers);
  if (worldId === 'chequeo-elevador')         return buildChequeoElevador(answers);
  if (worldId === 'inspeccion-epcc')          return buildInspeccionEpcc(answers);
  if (worldId === 'inspeccion-izaje')         return buildInspeccionIzaje(answers);
  if (worldId === 'inspeccion-epcc-bomberman')return buildInspeccionEpccBomberman(answers);
  if (worldId === 'checklist')                return buildChecklist(answers);
  if (worldId === 'herramientas-mantenimiento') {
    const ctx = getGameContext();
    // Cada answer[base] = { buena, mala, estado } → expandir a campos individuales
    const tools = [
      'copa_bristol_10mm','extension_media_x12_a','palanca_media_x15','llave_bristol_14',
      'llave_11','llave_12','llave_13','llave_14','llave_19',
      'destornillador_pala','destornillador_estrella','copa_punta_10_media',
      'extension_media_x12_b','rachet_media','llave_mixta_17','llave_expansiva_15'
    ];
    const result = {
      nombre_cliente:  ctx.cliente || ctx.proyecto,
      nombre_proyecto: ctx.proyecto,
      fecha_servicio:  todayStr(),
      nombre_operador: ctx.operador,
      empresa_id:      2,
      observaciones:   answers.observaciones || '',
      bomba_numero: Array.isArray(answers.bomba_numero)
        ? (answers.bomba_numero[0] || '')
        : (answers.bomba_numero || '')
    };
    tools.forEach(base => {
      const val = answers[base] || {};
      result[`${base}_buena`]  = parseInt(val.buena)  || 0;
      result[`${base}_mala`]   = parseInt(val.mala)   || 0;
      result[`${base}_estado`] = val.estado || '';
    });
    return result;
  }
  if (worldId === 'kit-limpieza') {
    const ctx = getGameContext();
    const tools = [
      'detergente_polvo','jabon_rey','espatula_flexible','grasa_litio',
      'aceite_hidraulico','plastico_grueso','talonario_bombeo','extintor',
      'botiquin','grasera','manguera_inyector_grasa','radio',
      'auricular','pimpina_acpm','bola_limpieza','perros','guaya'
    ];
    const result = {
      nombre_cliente:  ctx.cliente || ctx.proyecto,
      nombre_proyecto: ctx.proyecto,
      fecha_servicio:  todayStr(),
      nombre_operador: ctx.operador,
      empresa_id:      2,
      observaciones:   answers.observaciones || '',
      bomba_numero: Array.isArray(answers.bomba_numero)
        ? (answers.bomba_numero[0] || '')
        : (answers.bomba_numero || '')
    };
    tools.forEach(base => {
      const val = answers[base] || {};
      result[`${base}_buena`]  = parseInt(val.buena)  || 0;
      result[`${base}_mala`]   = parseInt(val.mala)   || 0;
      result[`${base}_estado`] = val.estado || '';
    });
    return result;
  }
  if (worldId === 'ats-operacion-torregrua')  return buildAts(answers, 'operacion-torregrua');
  if (worldId === 'ats-mando-inalam')         return buildAts(answers, 'mando-inalam');
  if (worldId === 'ats-montaje-torregrua')    return buildAts(answers, 'montaje-torregrua');
  if (worldId === 'ats-montaje-elevador')     return buildAts(answers, 'montaje-elevador');
  if (worldId === 'ats-desmontaje-torregrua') return buildAts(answers, 'desmontaje-torregrua');
  if (worldId === 'ats-telescopaje')          return buildAts(answers, 'telescopaje');
  if (worldId === 'ats-mantenimiento')        return buildAts(answers, 'mantenimiento');
  if (worldId === 'ats-elevador')             return buildAts(answers, 'elevador');
  return answers;
}

// ─── Persistencia en localStorage ────────────────────────────────────────────

function persistAnswers(worldId, answers) {
  // La mayoría de formularios no requieren persistencia en localStorage;
  // el modo gamificado envía directamente al backend al completar.
  if (worldId === 'permiso-trabajo') {
    localStorage.setItem('permiso_trabajo_respuestas', JSON.stringify({
      weekKey: weekKey(),
      epp: {
        casco_tipo1:             answers['casco_tipo1'],
        gafas:                   answers['gafas'],
        overol_dotacion:         answers['overol_dotacion'],
        botas_dielectricas:      answers['botas_dielectricas'],
        cuenta_certificado_alturas: answers['cuenta_certificado_alturas'],
        seguridad_social_arl:    answers['seguridad_social_arl'],
        proteccion_auditiva:     answers['proteccion_auditiva'],
        proteccion_respiratoria: answers['proteccion_respiratoria'],
        guantes_seguridad:       answers['guantes_seguridad'],
      },
      srpdc: {
        arnes_cuerpo_entero:     answers['arnes_cuerpo_entero'],
        arnes_dielectrico:       answers['arnes_dielectrico'],
        mosqueton:               answers['mosqueton'],
        arrestador_caidas:       answers['arrestador_caidas'],
        eslinga_y_absorbedor:    answers['eslinga_y_absorbedor'],
        eslinga_posicionamiento: answers['eslinga_posicionamiento'],
        linea_vida:              answers['linea_vida'],
        verificacion_anclaje:    answers['verificacion_anclaje'],
      },
    }));
  }
}

// ─── Submit al backend ────────────────────────────────────────────────────────

const ENDPOINTS = {
  'hora-ingreso':              '/horas_jornada/ingreso',
  'hora-salida':               '/horas_jornada/salida',
  'permiso-trabajo':           '/compartido/permiso_trabajo',
  'chequeo-altura':            '/compartido/chequeo_alturas',
  'chequeo-torregruas':        '/gruaman/chequeo_torregruas',
  'chequeo-elevador':          '/gruaman/chequeo_elevador',
  'inspeccion-epcc':           '/gruaman/inspeccion_epcc',
  'inspeccion-izaje':          '/gruaman/inspeccion_izaje',
  'inspeccion-epcc-bomberman': '/bomberman/inspeccion_epcc_bomberman',
  'checklist':                 '/bomberman/checklist',
  'herramientas-mantenimiento':'/bomberman/herramientas_mantenimiento',
  'kit-limpieza':              '/bomberman/kit_limpieza',
  'ats-operacion-torregrua':   '/gruaman/ats',
  'ats-mando-inalam':          '/gruaman/ats',
  'ats-montaje-torregrua':     '/gruaman/ats',
  'ats-montaje-elevador':      '/gruaman/ats',
  'ats-desmontaje-torregrua':  '/gruaman/ats',
  'ats-telescopaje':           '/gruaman/ats',
  'ats-mantenimiento':         '/gruaman/ats',
  'ats-elevador':              '/gruaman/ats',
};

/**
 * Convierte las respuestas, persiste en localStorage y hace POST al backend.
 * @param {string} worldId
 * @param {object} answers — respuestas acumuladas de todas las secciones
 * @returns {Promise<void>}
 */
export async function submitFormData(worldId, answers) {
  const endpoint = ENDPOINTS[worldId];
  if (!endpoint) throw new Error(`No endpoint configured for: ${worldId}`);

  const payload = convertAnswersToFormData(worldId, answers);
  persistAnswers(worldId, answers);

  await axios.post(`${API_BASE}${endpoint}`, payload);
}
