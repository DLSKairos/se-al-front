/**
 * Configuración de formularios gamificados para SEÑAL.
 *
 * Cada entrada describe una misión (formulario) incluyendo su ruta, nombre de componente,
 * tema visual y si debe completarse diariamente. Los IDs son utilizados por
 * LevelWrapper para resolver los componentes de formulario cargados de forma diferida.
 */

export const gameWorlds = [
  {
    id: 'hora-ingreso',
    name: 'Misión: Registro de Entrada',
    description: 'Registra tu llegada',
    icon: '🕐',
    emoji: '⏰',
    component: 'HoraIngreso',
    route: '/hora_ingreso',
    color: '#00D4FF',
    bgColor: 'rgba(22,34,56,0.6)',
    daily: true,
    order: 1,
    sections: 1
  },

  {
    id: 'permiso-trabajo',
    name: 'Misión: Permiso de Trabajo',
    description: 'Autorización para iniciar tareas',
    icon: '📋',
    emoji: '👷',
    component: 'PermisoTrabajo',
    route: '/permiso_trabajo',
    color: '#00D4FF',
    bgColor: 'rgba(22,34,56,0.6)',
    daily: true,
    order: 2,
    sections: 6
  },

  {
    id: 'hora-salida',
    name: 'Misión: Registro de Salida',
    description: 'Registra tu salida',
    icon: '🕔',
    emoji: '🌙',
    component: 'HoraSalida',
    route: '/hora_salida',
    color: '#00D4FF',
    bgColor: 'rgba(22,34,56,0.6)',
    daily: true,
    order: 3,
    sections: 1
  }
];

/**
 * Retorna todos los mundos disponibles.
 * @returns {object[]}
 */
export const getWorlds = () => gameWorlds;

/**
 * Alias de compatibilidad — ignora el parámetro character.
 * @returns {object[]}
 */
export const getWorldsByCharacter = () => gameWorlds;

/**
 * Retorna únicamente los mundos de cumplimiento diario obligatorio.
 * @returns {object[]}
 */
export const getDailyWorlds = () => gameWorlds.filter(w => w.daily !== false);

/**
 * Retorna la configuración de un mundo por su ID.
 * @param {string} worldId
 * @returns {object|undefined}
 */
export const getWorldById = (worldId) => gameWorlds.find(w => w.id === worldId);

/**
 * Calcula el porcentaje de completitud general de las misiones (0–100).
 * @param {number} completedWorlds
 * @param {number} totalWorlds
 * @returns {number}
 */
export const calculateProgress = (completedWorlds, totalWorlds) => {
  if (!totalWorlds || totalWorlds === 0) return 0;
  return Math.round((completedWorlds / totalWorlds) * 100);
};

export default gameWorlds;
