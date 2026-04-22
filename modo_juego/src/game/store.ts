import { create } from "zustand";

export type LevelStatus = "locked" | "available" | "current" | "done";

export interface Level {
  id: string;
  title: string;
  subtitle: string;
  type: "intro" | "fields" | "boss" | "review" | "bonus";
  xp: number;
}

export interface GalaxyForm {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  hue: number; // for color theming
  difficulty: 1 | 2 | 3;
  unlockedAt?: number; // levels needed in previous galaxy
  levels: Level[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface PowerUp {
  id: "hint" | "skip" | "shield" | "double";
  name: string;
  description: string;
  icon: string;
  count: number;
}

interface GameState {
  // Player
  playerName: string;
  xp: number;
  level: number; // player level derived but stored for animation
  gems: number;
  hearts: number;
  maxHearts: number;
  streak: number;
  lastPlayedDate: string | null;

  // Progress: levelId -> "done"
  completedLevels: Record<string, true>;
  // formId -> highest available level index
  formProgress: Record<string, number>;

  // Inventory
  powerUps: PowerUp[];
  achievements: Achievement[];

  // Actions
  completeLevel: (formId: string, levelId: string, xpGained: number, gemsGained: number) => void;
  loseHeart: () => void;
  refillHearts: () => void;
  usePowerUp: (id: PowerUp["id"]) => boolean;
  addPowerUp: (id: PowerUp["id"], count?: number) => void;
  unlockAchievement: (id: string) => void;
  bumpStreak: () => void;
  reset: () => void;
}

export const GALAXIES: GalaxyForm[] = [
  {
    id: "permiso-trabajo",
    name: "Permiso de Trabajo",
    tagline: "Autoriza operaciones con seguridad",
    emoji: "🛠️",
    hue: 30,
    difficulty: 1,
    levels: [
      { id: "pt-1", title: "Identificación", subtitle: "¿Quién, dónde, cuándo?", type: "intro", xp: 30 },
      { id: "pt-2", title: "Tipo de trabajo", subtitle: "Clasifica la tarea", type: "fields", xp: 40 },
      { id: "pt-3", title: "Riesgos", subtitle: "Detecta los peligros", type: "fields", xp: 50 },
      { id: "pt-4", title: "EPP requerido", subtitle: "Equipo de protección", type: "fields", xp: 50 },
      { id: "pt-5", title: "Aislamiento de energías", subtitle: "Bloqueo y etiquetado", type: "boss", xp: 80 },
      { id: "pt-6", title: "Firmas y cierre", subtitle: "Aprobaciones finales", type: "review", xp: 60 },
    ],
  },
  {
    id: "inspeccion-vehicular",
    name: "Inspección Vehicular",
    tagline: "Revisa la flota antes de salir",
    emoji: "🚛",
    hue: 200,
    difficulty: 2,
    unlockedAt: 3,
    levels: [
      { id: "iv-1", title: "Datos del vehículo", subtitle: "Placas y kilometraje", type: "intro", xp: 30 },
      { id: "iv-2", title: "Exterior", subtitle: "Carrocería y luces", type: "fields", xp: 50 },
      { id: "iv-3", title: "Mecánica", subtitle: "Motor y fluidos", type: "fields", xp: 60 },
      { id: "iv-4", title: "Seguridad", subtitle: "Frenos y cinturones", type: "boss", xp: 80 },
      { id: "iv-5", title: "Documentación", subtitle: "Cierre y firma", type: "review", xp: 50 },
    ],
  },
  {
    id: "incidente",
    name: "Reporte de Incidente",
    tagline: "Documenta lo que ocurrió",
    emoji: "⚠️",
    hue: 0,
    difficulty: 3,
    unlockedAt: 4,
    levels: [
      { id: "in-1", title: "Cuándo y dónde", subtitle: "Tiempo y lugar", type: "intro", xp: 40 },
      { id: "in-2", title: "Personas", subtitle: "Involucrados y testigos", type: "fields", xp: 60 },
      { id: "in-3", title: "Causas", subtitle: "Análisis raíz", type: "boss", xp: 100 },
      { id: "in-4", title: "Acciones", subtitle: "Correctivas y preventivas", type: "review", xp: 70 },
    ],
  },
  {
    id: "auditoria",
    name: "Auditoría Express",
    tagline: "Calidad bajo la lupa",
    emoji: "🔍",
    hue: 280,
    difficulty: 3,
    unlockedAt: 6,
    levels: [
      { id: "au-1", title: "Alcance", subtitle: "Define la auditoría", type: "intro", xp: 40 },
      { id: "au-2", title: "Hallazgos", subtitle: "Documenta evidencia", type: "fields", xp: 70 },
      { id: "au-3", title: "Calificación", subtitle: "Puntaje final", type: "boss", xp: 90 },
    ],
  },
];

const DEFAULT_POWERUPS: PowerUp[] = [
  { id: "hint", name: "Pista", description: "Muestra una sugerencia", icon: "💡", count: 3 },
  { id: "skip", name: "Saltar", description: "Avanza sin perder vida", icon: "⏭️", count: 1 },
  { id: "shield", name: "Escudo", description: "Bloquea un error", icon: "🛡️", count: 2 },
  { id: "double", name: "Doble XP", description: "x2 en este nivel", icon: "✨", count: 1 },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "first-step", name: "Primer paso", description: "Completa tu primer nivel", icon: "👟", unlocked: false },
  { id: "world-clear", name: "Conquistador", description: "Completa una galaxia entera", icon: "🌌", unlocked: false },
  { id: "streak-3", name: "En racha", description: "3 días consecutivos", icon: "🔥", unlocked: false },
  { id: "perfectionist", name: "Perfeccionista", description: "Nivel sin perder vidas", icon: "💎", unlocked: false },
  { id: "speedster", name: "Velocista", description: "Nivel en menos de 60s", icon: "⚡", unlocked: false },
  { id: "collector", name: "Coleccionista", description: "100 gemas acumuladas", icon: "💰", unlocked: false },
];

const today = () => new Date().toISOString().slice(0, 10);

export const useGame = create<GameState>()((set, get) => ({
      playerName: "Explorador",
      xp: 0,
      level: 1,
      gems: 0,
      hearts: 5,
      maxHearts: 5,
      streak: 0,
      lastPlayedDate: null,
      completedLevels: {},
      formProgress: {},
      powerUps: DEFAULT_POWERUPS,
      achievements: DEFAULT_ACHIEVEMENTS,

      completeLevel: (formId, levelId, xpGained, gemsGained) => {
        const state = get();
        if (state.completedLevels[levelId]) return;
        const newCompleted = { ...state.completedLevels, [levelId]: true as const };
        const galaxy = GALAXIES.find((g) => g.id === formId);
        const idx = galaxy?.levels.findIndex((l) => l.id === levelId) ?? -1;
        const currentProgress = state.formProgress[formId] ?? 0;
        const newProgress = Math.max(currentProgress, idx + 1);
        const newXp = state.xp + xpGained;
        const newLevel = Math.floor(newXp / 100) + 1;
        set({
          completedLevels: newCompleted,
          formProgress: { ...state.formProgress, [formId]: newProgress },
          xp: newXp,
          level: newLevel,
          gems: state.gems + gemsGained,
        });
        if (galaxy && newProgress >= galaxy.levels.length) {
          get().unlockAchievement("world-clear");
        }
        if (state.gems + gemsGained >= 100) {
          get().unlockAchievement("collector");
        }
      },

      loseHeart: () => {
        const h = get().hearts;
        if (h > 0) set({ hearts: h - 1 });
      },
      refillHearts: () => set({ hearts: get().maxHearts }),

      usePowerUp: (id) => {
        const pu = get().powerUps.find((p) => p.id === id);
        if (!pu || pu.count <= 0) return false;
        set({
          powerUps: get().powerUps.map((p) =>
            p.id === id ? { ...p, count: p.count - 1 } : p,
          ),
        });
        return true;
      },
      addPowerUp: (id, count = 1) =>
        set({
          powerUps: get().powerUps.map((p) =>
            p.id === id ? { ...p, count: p.count + count } : p,
          ),
        }),

      unlockAchievement: (id) => {
        const a = get().achievements.find((x) => x.id === id);
        if (!a || a.unlocked) return;
        set({
          achievements: get().achievements.map((x) =>
            x.id === id ? { ...x, unlocked: true } : x,
          ),
        });
      },

      bumpStreak: () => {
        const t = today();
        const last = get().lastPlayedDate;
        if (last === t) return;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak = last === yesterday ? get().streak + 1 : 1;
        set({ streak: newStreak, lastPlayedDate: t });
        if (newStreak >= 3) get().unlockAchievement("streak-3");
      },

      reset: () =>
        set({
          xp: 0,
          level: 1,
          gems: 0,
          hearts: 5,
          streak: 0,
          completedLevels: {},
          formProgress: {},
          powerUps: DEFAULT_POWERUPS,
          achievements: DEFAULT_ACHIEVEMENTS,
          lastPlayedDate: null,
        }),
}));

export const LEADERBOARD = [
  { name: "Marina C.", xp: 2840, avatar: "🦊" },
  { name: "Diego R.", xp: 2310, avatar: "🐺" },
  { name: "Sofía L.", xp: 1990, avatar: "🦉" },
  { name: "Iván P.", xp: 1450, avatar: "🐸" },
  { name: "Elena M.", xp: 980, avatar: "🦝" },
];
