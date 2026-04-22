import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Lock, Check, Crown, BookOpen, Sparkles, Star } from "lucide-react";
import { GALAXIES, useGame, type Level } from "@/game/store";
import { StreakRocket } from "@/game/HUD";

export const Route = createFileRoute("/galaxia/$formId")({
  component: GalaxyView,
});

function GalaxyView() {
  const { formId } = Route.useParams();
  const navigate = useNavigate();
  const galaxy = GALAXIES.find((g) => g.id === formId);
  const { formProgress, completedLevels } = useGame();

  if (!galaxy) {
    return (
      <div className="bg-cosmos grid min-h-screen place-items-center text-cream">
        <div className="text-center">
          <p className="text-6xl">🛸</p>
          <h1 className="font-heading mt-4 text-2xl font-bold">Galaxia no encontrada</h1>
          <Link to="/" className="btn-3d btn-3d-primary mt-6 inline-block">
            Volver al universo
          </Link>
        </div>
      </div>
    );
  }

  const progress = formProgress[galaxy.id] ?? 0;
  const positions = buildPath(galaxy.levels.length);

  return (
    <div className="bg-cosmos relative min-h-screen pb-32 text-cream">
      <StreakRocket />
      <div className="mx-auto max-w-md px-5 py-5">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-cream/10 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-cream/20"
          >
            <ArrowLeft className="size-3.5" /> Universo
          </Link>
        </div>

        <div
          className="card-glass relative mb-6 overflow-hidden p-5"
          style={{
            background: `linear-gradient(135deg, oklch(0.4 0.15 ${galaxy.hue} / 0.4), oklch(0.2 0.05 265 / 0.6))`,
          }}
        >
          <div
            className="planet absolute -right-6 -top-6 size-24 animate-float-slow"
            style={{
              background: `radial-gradient(circle at 30% 30%, oklch(0.8 0.15 ${galaxy.hue}), oklch(0.45 0.18 ${galaxy.hue}) 70%, oklch(0.2 0.1 ${galaxy.hue}))`,
            }}
          >
            <div className="grid h-full place-items-center text-3xl">{galaxy.emoji}</div>
          </div>
          <p className="font-sub text-[11px] uppercase tracking-widest text-amber">Constelación</p>
          <h1 className="font-heading text-2xl font-bold">{galaxy.name}</h1>
          <p className="mt-1 max-w-[65%] text-xs text-cream/70">{galaxy.tagline}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-night/40 px-3 py-1 text-xs">
            <Sparkles className="size-3 text-amber" />
            <span className="font-semibold">{progress} / {galaxy.levels.length} niveles</span>
          </div>
        </div>

        <div className="relative mx-auto" style={{ width: 320, height: positions.height }}>
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 320 ${positions.height}`}>
            {positions.points.map((p, i) => {
              if (i === 0) return null;
              const prev = positions.points[i - 1];
              const isUnlocked = i <= progress;
              return (
                <line
                  key={i}
                  x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
                  stroke={isUnlocked ? "var(--amber)" : "oklch(1 0 0 / 0.15)"}
                  strokeWidth={isUnlocked ? 2.5 : 1.5}
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                  style={isUnlocked ? { filter: "drop-shadow(0 0 6px var(--amber))" } : undefined}
                />
              );
            })}
          </svg>

          {galaxy.levels.map((lvl, i) => {
            const pos = positions.points[i];
            const isDone = !!completedLevels[lvl.id];
            const isCurrent = i === progress && !isDone;
            const isLocked = i > progress;
            return (
              <PlanetNode
                key={lvl.id}
                level={lvl}
                index={i}
                galaxyId={galaxy.id}
                x={pos.x}
                y={pos.y}
                done={isDone}
                current={isCurrent}
                locked={isLocked}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlanetNode({ level, index, galaxyId, x, y, done, current, locked }: {
  level: Level; index: number; galaxyId: string; x: number; y: number;
  done: boolean; current: boolean; locked: boolean;
}) {
  const icon = done ? <Check className="size-7" /> : iconForType(level.type);
  const cls = locked ? "planet planet-locked" : done ? "planet planet-done" : current ? "planet planet-current" : "planet";

  const content = (
    <div className="absolute" style={{ left: x - 44, top: y - 44, animation: `pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 100}ms both` }}>
      <div className="relative">
        <div className={`${cls} grid size-[88px] place-items-center text-cream`}>
          {locked ? <Lock className="size-7 opacity-60" /> : icon}
        </div>
        {current && (
          <div className="font-sub absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-night shadow-lg">
            ¡Empieza!
          </div>
        )}
        {done && <Star className="absolute -right-1 -top-1 size-5 fill-amber text-amber drop-shadow-[0_0_6px_var(--amber)]" />}
        <p className={`font-sub mt-2 text-center text-xs font-bold ${locked ? "text-cream/40" : "text-cream"}`}>{level.title}</p>
        <p className="text-center text-[10px] text-cream/50">+{level.xp} XP</p>
      </div>
    </div>
  );

  if (locked) return content;

  return (
    <Link to="/galaxia/$formId/nivel/$levelId" params={{ formId: galaxyId, levelId: level.id }} className="block transition-transform hover:scale-105">
      {content}
    </Link>
  );
}

function iconForType(type: Level["type"]) {
  switch (type) {
    case "intro": return <BookOpen className="size-7" />;
    case "boss": return <Crown className="size-7" />;
    case "review": return <Sparkles className="size-7" />;
    default: return <Star className="size-7" />;
  }
}

function buildPath(count: number) {
  const stepY = 130;
  const points = Array.from({ length: count }, (_, i) => {
    const phase = i % 4;
    const xMap = [80, 160, 240, 160];
    return { x: xMap[phase], y: 60 + i * stepY };
  });
  return { points, height: 60 + count * stepY + 40 };
}
