import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GALAXIES, useGame, type GalaxyForm } from "@/game/store";
import { StreakRocket } from "@/game/HUD";
import { Lock, Sparkles, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SEÑAL — Modo Juego" },
      {
        name: "description",
        content:
          "Convierte cada formulario en una aventura. Conquista galaxias y mantén tu racha.",
      },
      { property: "og:title", content: "SEÑAL — Modo Juego" },
      {
        property: "og:description",
        content: "Formularios operativos gamificados al estilo Duolingo y Mario Bros.",
      },
    ],
  }),
  component: GalaxyHome,
});

// Hand-tuned positions on a 360x520 canvas (percent-based for responsiveness)
type PlanetPos = { x: number; y: number; size: number };
const POSITIONS: PlanetPos[] = [
  { x: 28, y: 22, size: 132 }, // top-left, biggest (intro world)
  { x: 72, y: 38, size: 108 }, // top-right
  { x: 24, y: 62, size: 116 }, // mid-left
  { x: 70, y: 80, size: 124 }, // bottom-right
];

function GalaxyHome() {
  const { formProgress, bumpStreak } = useGame();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    bumpStreak();
  }, [bumpStreak]);

  const totalCompleted = useMemo(
    () => Object.values(formProgress).reduce((a, b) => a + b, 0),
    [formProgress],
  );

  const galaxiesWithMeta = GALAXIES.map((g, i) => ({
    galaxy: g,
    pos: POSITIONS[i] ?? POSITIONS[POSITIONS.length - 1],
    locked: (g.unlockedAt ?? 0) > totalCompleted,
    progress: formProgress[g.id] ?? 0,
    index: i,
  }));

  const selectedData = galaxiesWithMeta.find((g) => g.galaxy.id === selected) ?? null;

  return (
    <div className="bg-cosmos relative min-h-screen overflow-hidden text-cream">
      {/* Decorative shooting stars */}
      <div
        className="pointer-events-none absolute left-0 top-32 h-px w-24 bg-gradient-to-r from-transparent via-cream to-transparent"
        style={{ animation: "shooting-star 7s linear infinite" }}
      />
      <div
        className="pointer-events-none absolute left-0 top-[60%] h-px w-32 bg-gradient-to-r from-transparent via-amber to-transparent"
        style={{ animation: "shooting-star 9s linear infinite 3s" }}
      />

      <StreakRocket />

      <div className="relative mx-auto max-w-md px-5 pb-32 pt-6">
        <header className="relative z-10 mb-2">
          <p className="font-sub text-xs uppercase tracking-widest text-amber">SEÑAL</p>
          <h1 className="text-cosmos-heading text-3xl leading-none">Universo Operativo</h1>
          <p className="mt-2 max-w-[78%] text-sm text-cream/60">
            Toca un planeta para descubrir tu próxima misión.
          </p>
        </header>

        {/* Star map */}
        <StarMap
          galaxies={galaxiesWithMeta}
          selected={selected}
          onSelect={setSelected}
        />

        {/* Floating detail card for selected planet */}
        <SelectedPlanetCard data={selectedData} onClose={() => setSelected(null)} />

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest text-cream/40">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber shadow-[0_0_8px_var(--amber)]" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" />
            En progreso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-cream/30" />
            Bloqueado
          </span>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Star Map ─────────────────────────
function StarMap({
  galaxies,
  selected,
  onSelect,
}: {
  galaxies: { galaxy: GalaxyForm; pos: PlanetPos; locked: boolean; progress: number; index: number }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  // Container is 360x520 logical units; we scale via aspect-ratio
  const W = 360;
  const H = 520;

  return (
    <div className="relative mx-auto mt-4 w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      {/* Nebula clouds */}
      <div
        className="nebula"
        style={{
          left: "10%", top: "15%", width: "55%", height: "40%",
          background: "radial-gradient(circle, oklch(0.55 0.22 30 / 0.5), transparent 70%)",
        }}
      />
      <div
        className="nebula"
        style={{
          right: "5%", top: "55%", width: "60%", height: "45%",
          background: "radial-gradient(circle, oklch(0.5 0.2 280 / 0.45), transparent 70%)",
          animationDelay: "5s",
        }}
      />

      {/* SVG constellation lines connecting planets */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        {galaxies.slice(0, -1).map((g, i) => {
          const a = g.pos;
          const b = galaxies[i + 1].pos;
          const x1 = (a.x / 100) * W;
          const y1 = (a.y / 100) * H;
          const x2 = (b.x / 100) * W;
          const y2 = (b.y / 100) * H;
          const isActive = !g.locked && !galaxies[i + 1].locked;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isActive ? "var(--amber)" : "oklch(1 0 0 / 0.18)"}
              strokeWidth={isActive ? 1.5 : 1}
              strokeDasharray="3 5"
              strokeLinecap="round"
              style={isActive ? { filter: "drop-shadow(0 0 4px var(--amber))" } : undefined}
              className="constellation-line"
              strokeDashoffset={100}
            />
          );
        })}

        {/* Tiny stars scattered */}
        {SCATTERED_STARS.map((s, i) => (
          <circle
            key={i}
            cx={(s.x / 100) * W}
            cy={(s.y / 100) * H}
            r={s.r}
            fill="var(--cream)"
            opacity={s.o}
          />
        ))}
      </svg>

      {/* Planets */}
      {galaxies.map(({ galaxy, pos, locked, progress, index }) => (
        <PlanetButton
          key={galaxy.id}
          galaxy={galaxy}
          pos={pos}
          locked={locked}
          progress={progress}
          index={index}
          isSelected={selected === galaxy.id}
          onSelect={() => onSelect(galaxy.id)}
        />
      ))}
    </div>
  );
}

const SCATTERED_STARS = [
  { x: 50, y: 8, r: 1, o: 0.7 },
  { x: 88, y: 12, r: 1.2, o: 0.5 },
  { x: 8, y: 38, r: 0.8, o: 0.6 },
  { x: 92, y: 55, r: 1, o: 0.7 },
  { x: 48, y: 50, r: 0.9, o: 0.4 },
  { x: 12, y: 78, r: 1.1, o: 0.6 },
  { x: 50, y: 92, r: 1, o: 0.5 },
  { x: 38, y: 30, r: 0.7, o: 0.4 },
  { x: 60, y: 68, r: 0.8, o: 0.5 },
];

// ───────────────────────── Planet button ─────────────────────────
function PlanetButton({
  galaxy,
  pos,
  locked,
  progress,
  index,
  isSelected,
  onSelect,
}: {
  galaxy: GalaxyForm;
  pos: PlanetPos;
  locked: boolean;
  progress: number;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const total = galaxy.levels.length;
  const pct = total > 0 ? (progress / total) * 100 : 0;
  const inProgress = !locked && progress > 0 && progress < total;

  // Scale relative to container (container width = 360 logical units)
  const sizePct = (pos.size / 360) * 100;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 focus:outline-none"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: `${sizePct}%`,
        aspectRatio: "1 / 1",
        animation: `pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 120}ms both`,
      }}
      aria-label={`${galaxy.name}${locked ? " (bloqueado)" : ""}`}
    >
      {/* Orbit ring */}
      {!locked && (
        <div
          className="orbit-ring"
          style={{
            inset: "-14%",
            animation: `orbit-ring ${20 + index * 4}s linear infinite${index % 2 ? " reverse" : ""}`,
          }}
        >
          {/* Orbiting moon */}
          <div
            className="absolute size-2 rounded-full bg-amber shadow-[0_0_8px_var(--amber)]"
            style={{ top: "-4px", left: "50%", transform: "translateX(-50%)" }}
          />
        </div>
      )}

      {/* Pulse rings for current/in-progress */}
      {inProgress && (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-full border border-amber"
            style={{ animation: "pulse-ring 2.5s ease-out infinite" }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full border border-amber"
            style={{ animation: "pulse-ring 2.5s ease-out infinite 1.25s" }}
          />
        </>
      )}

      {/* The planet body */}
      <div
        className={`relative h-full w-full rounded-full transition-all duration-300 ${
          isSelected ? "scale-110" : "group-hover:scale-105"
        } ${!locked ? "animate-drift" : ""}`}
        style={{
          animationDuration: `${7 + index}s`,
          animationDelay: `${index * 0.7}s`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: locked
              ? "radial-gradient(circle at 30% 30%, oklch(0.45 0.02 265), oklch(0.22 0.02 265) 70%, oklch(0.12 0.02 265))"
              : `radial-gradient(circle at 30% 28%, oklch(0.82 0.16 ${galaxy.hue}), oklch(0.5 0.2 ${galaxy.hue}) 60%, oklch(0.22 0.1 ${galaxy.hue}))`,
            boxShadow: locked
              ? "inset -8px -10px 20px oklch(0 0 0 / 0.5), 0 12px 30px oklch(0 0 0 / 0.4)"
              : `inset -10px -12px 24px oklch(0 0 0 / 0.4), 0 0 40px oklch(0.6 0.2 ${galaxy.hue} / 0.4), 0 14px 36px oklch(0 0 0 / 0.5)`,
            opacity: locked ? 0.55 : 1,
          }}
        />

        {/* Surface texture */}
        {!locked && (
          <div
            className="absolute inset-0 rounded-full mix-blend-overlay opacity-40"
            style={{
              background: `radial-gradient(ellipse at 65% 70%, oklch(0 0 0 / 0.5), transparent 50%), radial-gradient(circle at 20% 60%, oklch(1 0 0 / 0.2), transparent 30%)`,
            }}
          />
        )}

        {/* Emoji / lock */}
        <div className="absolute inset-0 grid place-items-center">
          <span
            className="text-4xl drop-shadow-lg"
            style={{ fontSize: `${pos.size * 0.32}px` }}
          >
            {locked ? "🔒" : galaxy.emoji}
          </span>
        </div>

        {/* Progress arc */}
        {!locked && pct > 0 && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="var(--amber)"
              strokeWidth="2.5"
              strokeDasharray={`${(pct / 100) * 301.6} 301.6`}
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 4px var(--amber))" }}
            />
          </svg>
        )}

        {/* Selection ring */}
        {isSelected && (
          <div className="pointer-events-none absolute -inset-2 rounded-full border-2 border-amber shadow-[0_0_30px_var(--amber)]" />
        )}
      </div>

      {/* Label below planet */}
      <div className="absolute left-1/2 top-[calc(100%+8px)] w-max max-w-[140px] -translate-x-1/2 text-center">
        <p
          className={`font-sub text-[10px] font-bold uppercase tracking-widest ${
            locked ? "text-cream/35" : "text-cream"
          }`}
        >
          {galaxy.name}
        </p>
      </div>
    </button>
  );
}

// ───────────────────────── Detail card ─────────────────────────
function SelectedPlanetCard({
  data,
  onClose,
}: {
  data: { galaxy: GalaxyForm; locked: boolean; progress: number } | null;
  onClose: () => void;
}) {
  if (!data) return null;

  const { galaxy, locked, progress } = data;
  const total = galaxy.levels.length;
  const pct = (progress / total) * 100;

  return (
    <>
      {/* Backdrop to close on tap */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar detalle"
        className="fixed inset-0 z-40 bg-night/40 backdrop-blur-sm"
        style={{ animation: "fade-in 0.2s ease-out both" }}
      />

      {/* Floating sheet anchored to bottom of viewport */}
      <div
        key={galaxy.id}
        className="card-glass fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md overflow-hidden rounded-t-3xl rounded-b-none p-5 pb-8"
        style={{
          background: `linear-gradient(135deg, oklch(0.4 0.15 ${galaxy.hue} / 0.55), oklch(0.18 0.05 265 / 0.95))`,
          boxShadow: "0 -20px 50px oklch(0 0 0 / 0.5)",
          animation: "slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cream/30" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-cream/10 text-cream/80 transition hover:bg-cream/20"
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="text-4xl">{locked ? "🔒" : galaxy.emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <DifficultyDots level={galaxy.difficulty} />
              <span className="font-sub text-[10px] uppercase tracking-widest text-cream/50">
                {galaxy.levels.length} niveles
              </span>
            </div>
            <h2 className="font-heading mt-0.5 text-xl font-bold leading-tight">
              {galaxy.name}
            </h2>
            <p className="mt-1 text-xs text-cream/70">{galaxy.tagline}</p>
          </div>
        </div>

        {locked ? (
          <p className="font-sub mt-4 inline-flex items-center gap-1.5 rounded-full bg-cream/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cream/70">
            <Lock className="size-3" /> Necesitas {galaxy.unlockedAt} niveles para desbloquear
          </p>
        ) : (
          <>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[11px] text-cream/60">
                <span>{progress}/{total} niveles</span>
                <span className="font-bold text-amber">
                  {progress === total ? "Completo ✨" : `${Math.round(pct)}%`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-cream/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber to-terracotta transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <Link
              to="/galaxia/$formId"
              params={{ formId: galaxy.id }}
              className="btn-3d btn-3d-primary mt-5 inline-flex w-full items-center justify-center gap-2"
            >
              {progress === 0 ? "Iniciar misión" : progress === total ? "Revisar galaxia" : "Continuar"}
              <ChevronRight className="size-4" />
            </Link>
          </>
        )}
      </div>
    </>
  );
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`size-1.5 rounded-full ${i <= level ? "bg-amber" : "bg-cream/20"}`}
        />
      ))}
    </span>
  );
}
