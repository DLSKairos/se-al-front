/**
 * Configuración de mundos y niveles para el flujo de formularios gamificado.
 *
 * Cada entrada describe una misión (formulario) incluyendo su ruta, nombre de componente,
 * tema visual y si debe completarse diariamente. Los IDs son utilizados por
 * LevelWrapper para resolver los componentes de formulario cargados de forma diferida.
 */

export const gameWorlds = {
  bomberman: [
    {
      id: 'hora-ingreso',
      name: 'Misión: Registro de Entrada',
      description: 'Registra tu llegada',
      icon: '🕐',
      emoji: '⏰',
      shared: true,
      component: 'HoraIngreso',
      route: '/hora_ingreso',
      color: '#F5A623',
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
      emoji: '👷‍♀️',
      shared: true,
      component: 'PermisoTrabajo',
      route: '/permiso_trabajo',
      color: '#00D4FF',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: true,
      order: 2,
      sections: 6
    },

    {
      id: 'planilla-bombeo',
      name: 'Misión: Planilla de Bombeo',
      description: 'Control de operación de bomba',
      icon: '💧',
      emoji: '🌊',
      shared: false,
      component: 'PlanillaBombeo',
      route: '/planillabombeo',
      color: '#F5A623',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 3,
      sections: 3
    },

    {
      id: 'checklist',
      name: 'Misión: Checklist Bomba',
      description: 'Revisión completa del equipo',
      icon: '✅',
      emoji: '🔧',
      shared: false,
      component: 'Checklist',
      route: '/checklist',
      color: '#F5A623',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 4,
      sections: 3
    },

    {
      id: 'herramientas-mantenimiento',
      name: 'Misión: Herramientas de Mantenimiento',
      description: 'Control de herramientas de mantenimiento',
      icon: '🔩',
      emoji: '🧰',
      shared: false,
      component: 'HerramientasMantenimiento',
      route: '/herramientas_mantenimiento',
      color: '#F5A623',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 5,
      sections: 2
    },

    {
      id: 'kit-limpieza',
      name: 'Misión: Kit de Lavado',
      description: 'Kit de lavado y mantenimiento',
      icon: '🧴',
      emoji: '🧹',
      shared: false,
      component: 'KitLimpieza',
      route: '/kit_limpieza',
      color: '#00D4FF',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 6,
      sections: 2
    },

    {
      id: 'chequeo-altura',
      name: 'Misión: Trabajo en Altura',
      description: 'Verificación de seguridad en alturas',
      icon: '🪜',
      emoji: '⬆️',
      shared: true,
      component: 'ChequeoAlturas',
      route: '/chequeo_alturas',
      color: '#00D4FF',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 6,
      sections: 4
    },

    {
      id: 'inspeccion-epcc-bomberman',
      name: 'Misión: Inspección EPCC',
      description: 'Equipos de protección certificados',
      icon: '🛡',
      emoji: '🛡️',
      shared: false,
      component: 'InspeccionEpccBomberman',
      route: '/inspeccion_epcc_bomberman',
      color: '#00D4FF',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 7,
      sections: 2
    },

    {
      id: 'inventarios-obra',
      name: 'Misión: Inventario de Obra',
      description: 'Control de materiales y herramientas',
      icon: '📦',
      emoji: '📝',
      shared: false,
      component: 'InventariosObra',
      route: '/inventariosobra',
      color: 'rgba(240,244,248,0.5)',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 8,
      sections: 2
    },

    {
      id: 'hora-salida',
      name: 'Misión: Registro de Salida',
      description: 'Registra tu salida',
      icon: '🕔',
      emoji: '🌙',
      shared: true,
      component: 'HoraSalida',
      route: '/hora_salida',
      color: '#F5A623',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: true,
      order: 8,
      sections: 1
    }
  ],

  // ===========================================
  // GRUAMAN - 8 FORMULARIOS
  // Orden: hora_ingreso, permiso_trabajo, chequeo_alturas, chequeo_torregruas,
  //        chequeo_elevador, inspeccion_epcc, inspeccion_izaje, hora_salida
  // ===========================================
  gruaman: [
    {
      id: 'hora-ingreso',
      name: 'Misión: Registro de Entrada',
      description: 'Registra tu llegada',
      icon: '🕐',
      emoji: '⏰',
      shared: true,
      component: 'HoraIngreso',
      route: '/hora_ingreso',
      color: '#F5A623',
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
      emoji: '👷‍♀️',
      shared: true,
      component: 'PermisoTrabajo',
      route: '/permiso_trabajo',
      color: '#00D4FF',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: true,
      order: 2,
      sections: 6
    },

    {
      id: 'chequeo-altura',
      name: 'Misión: Trabajo en Altura',
      description: 'Verificación de seguridad en alturas',
      icon: '🪜',
      emoji: '⬆️',
      shared: true,
      component: 'ChequeoAlturas',
      route: '/chequeo_alturas',
      color: '#00D4FF',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 3,
      sections: 4
    },

    {
      id: 'chequeo-torregruas',
      name: 'Misión: Chequeo Torregrúa',
      description: 'Inspección de torre grúa',
      icon: '🏗️',
      emoji: '🏗️',
      shared: false,
      component: 'ChequeoTorregruas',
      route: '/chequeo_torregruas',
      color: '#00D4FF',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 4,
      sections: 3
    },

    {
      id: 'chequeo-elevador',
      name: 'Misión: Chequeo Elevador',
      description: 'Inspección de elevador de carga',
      icon: '🔼',
      emoji: '📦',
      shared: false,
      component: 'ChequeoElevador',
      route: '/chequeo_elevador',
      color: '#F5A623',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 5,
      sections: 3
    },

    {
      id: 'inspeccion-epcc',
      name: 'Misión: Inspección EPCC',
      description: 'Equipos de protección certificados',
      icon: '🛡',
      emoji: '🛡️',
      shared: false,
      component: 'InspeccionEpcc',
      route: '/inspeccion_epcc',
      color: '#00D4FF',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 6,
      sections: 2
    },

    {
      id: 'inspeccion-izaje',
      name: 'Misión: Inspección Izaje',
      description: 'Control de equipos de izaje',
      icon: '⚙️',
      emoji: '🏋',
      shared: false,
      component: 'InspeccionIzaje',
      route: '/inspeccion_izaje',
      color: '#00D4FF',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 7,
      sections: 2
    },

    {
      id: 'ats',
      name: 'Misión: ATS',
      description: 'Análisis de Trabajo Seguro',
      icon: '📋',
      emoji: '🦺',
      shared: false,
      component: 'AtsSelector',
      route: '/ats-selector',
      color: '#F5A623',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: false,
      order: 8,
      sections: 1
    },

    {
      id: 'hora-salida',
      name: 'Misión: Registro de Salida',
      description: 'Registra tu salida',
      icon: '🕔',
      emoji: '🌙',
      shared: true,
      component: 'HoraSalida',
      route: '/hora_salida',
      color: '#F5A623',
      bgColor: 'rgba(22,34,56,0.6)',
      daily: true,
      order: 9,
      sections: 1
    }
  ]
};

/**
 * Retorna todas las configuraciones de mundos para un personaje dado.
 * @param {'bomberman'|'gruaman'} character
 * @returns {object[]}
 */
export const getWorldsByCharacter = (character) => {
  return gameWorlds[character] || [];
};

/**
 * Retorna únicamente los mundos de cumplimiento diario obligatorio para el personaje dado.
 * @param {'bomberman'|'gruaman'} character
 * @returns {object[]}
 */
export const getDailyWorlds = (character) => {
  const worlds = gameWorlds[character] || [];
  return worlds.filter(w => w.daily !== false);
};

/**
 * Retorna la configuración de un único mundo según el personaje y su ID.
 * @param {'bomberman'|'gruaman'} character
 * @param {string} worldId
 * @returns {object|undefined}
 */
export const getWorldById = (character, worldId) => {
  const worlds = gameWorlds[character] || [];
  return worlds.find(w => w.id === worldId);
};

/**
 * Retorna true si el mundo con el ID dado está marcado como compartido entre personajes.
 * Busca en los arrays de bomberman y gruaman; no se requiere deduplicación.
 * @param {string} worldId
 * @returns {boolean}
 */
export const isSharedWorld = (worldId) => {
  const allWorlds = [...gameWorlds.bomberman, ...gameWorlds.gruaman];
  const world = allWorlds.find(w => w.id === worldId);
  return world?.shared || false;
};

/**
 * Retorna los tokens de color primario/secundario y el degradado CSS para un personaje.
 * @param {'bomberman'|'gruaman'} character
 * @returns {{ primary: string, secondary: string, gradient: string } | undefined}
 */
export const getCharacterColor = (character) => {
  return {
    bomberman: {
      primary: '#F5A623',
      secondary: '#d4890f',
      gradient: 'linear-gradient(135deg, #F5A623 0%, #d4890f 100%)'
    },
    gruaman: {
      primary: '#00D4FF',
      secondary: '#0099cc',
      gradient: 'linear-gradient(135deg, #00D4FF 0%, #0099cc 100%)'
    }
  }[character];
};

/**
 * Retorna el nombre de presentación para una clave de personaje.
 * Si el personaje no se reconoce, retorna la clave sin procesar.
 * @param {'bomberman'|'gruaman'} character
 * @returns {string}
 */
export const getCharacterName = (character) => {
  return {
    bomberman: 'Operador Bomba',
    gruaman: 'Operador Grúa'
  }[character] || character;
};

/**
 * Deriva la clave de personaje a partir de `usuario.empresa`.
 * 'GyE' se mapea a 'gruaman'; todos los demás valores (AIC, Lideres, etc.) a 'bomberman'.
 * @param {string} empresa
 * @returns {'bomberman'|'gruaman'}
 */
export const determineCharacter = (empresa) => {
  if (empresa === 'GyE') return 'gruaman';
  return 'bomberman';
};

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
