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
  || 'http://localhost:3000';

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

};

// ─── Exports principales ──────────────────────────────────────────────────────

/** Mundos obligatorios — no llevan pregunta de preámbulo */
const MANDATORY_WORLDS = new Set([
  'hora-ingreso', 'permiso-trabajo', 'hora-salida',
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
export function parseFormToQuestions(worldId) {
  const sections = QUESTIONS_CONFIG[worldId] ?? null;

  if (!sections) return null;

  // Mundos opcionales llevan pregunta "¿debes llenarlo hoy?" al inicio
  if (!MANDATORY_WORLDS.has(worldId)) {
    return [PREAMBLE_SECTION, ...sections];
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

export function convertAnswersToFormData(worldId, answers) {
  if (worldId === 'hora-ingreso')    return buildHoraIngreso();
  if (worldId === 'hora-salida')     return buildHoraSalida();
  if (worldId === 'permiso-trabajo') return buildPermisoTrabajo(answers);
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
  'hora-ingreso':    '/horas_jornada/ingreso',
  'hora-salida':     '/horas_jornada/salida',
  'permiso-trabajo': '/compartido/permiso_trabajo',
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
