import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, Trophy, Zap, Clock } from "lucide-react";
import { GALAXIES } from "@/game/store";

export const Route = createFileRoute("/galaxia_/$formId_/victoria/$levelId")({
  validateSearch: (s: Record<string, unknown>) => ({
    xp: Number(s.xp ?? 0),
    perfect: Number(s.perfect ?? 0),
    combo: Number(s.combo ?? 0),
    time: Number(s.time ?? 0),
  }),
  component: VictoryView,
});

function VictoryView() {
  const { formId: formId_, levelId } = Route.useParams();
  const formId = formId_;
  const { xp, perfect, combo, time } = Route.useSearch();

  const galaxy = GALAXIES.find((g) => g.id === formId);
  const level = galaxy?.levels.find((l) => l.id === levelId);
  const idx = galaxy?.levels.findIndex((l) => l.id === levelId) ?? -1;
  const next = galaxy?.levels[idx + 1] ?? null;
  const galaxyDone = next === null;

  useEffect(() => {
    let cancelled = false;
    import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      const fire = mod.default;
      fire({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ["#F4A923", "#C4500A", "#FAF4E8"] });
      setTimeout(() => !cancelled && fire({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ["#F4A923", "#C4500A", "#FAF4E8"] }), 400);
    });
    return () => { cancelled = true; };
  }, []);

  if (!galaxy || !level) {
    return (
      <div className="bg-cosmos grid min-h-screen place-items-center text-cream">
        <Link to="/" className="btn-3d btn-3d-primary">Volver</Link>
      </div>
    );
  }

  return (
    <div className="bg-cosmos relative flex min-h-screen flex-col items-center justify-center px-5 py-8 text-cream">
      <div className="w-full max-w-md">
        <p className="font-sub animate-bounce-in text-center text-xs uppercase tracking-[0.3em] text-amber">
          {galaxyDone ? "Galaxia conquistada" : "Nivel completado"}
        </p>
        <h1 className="text-cosmos-heading mt-2 text-center text-4xl font-black leading-none" style={{ animation: "bounce-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both" }}>
          {galaxyDone ? "¡Estrella conquistada!" : "¡Nivel superado!"}
        </h1>
        <p className="mt-2 text-center text-sm text-cream/70">{galaxy.emoji} {galaxy.name} · {level.title}</p>

        <div className="relative mx-auto my-8 grid size-40 place-items-center" style={{ animation: "bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both" }}>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber/40 to-transparent blur-2xl" style={{ animation: "pulse-glow 2s ease-in-out infinite" }} />
          <div className="relative animate-float text-8xl">{galaxyDone ? "🏆" : "🎁"}</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Sparkles className="size-5 text-amber" />} label="XP ganado" value={`+${xp}`} delay={400} />
          <StatCard icon={<Zap className="size-5 text-amber" />} label="Mejor combo" value={`x${combo}`} delay={500} />
          <StatCard icon={<Clock className="size-5 text-amber" />} label="Tiempo" value={`${time}s`} delay={600} />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {perfect ? <Badge icon="💎" label="Perfeccionista" /> : null}
          {time < 60 && time > 0 ? <Badge icon="⚡" label="Velocista" /> : null}
          {combo >= 3 ? <Badge icon="🔥" label={`Combo x${combo}`} /> : null}
          {galaxyDone ? <Badge icon="🌌" label="Galaxia 100%" /> : null}
        </div>

        <div className="mt-8 space-y-3">
          {next ? (
            <Link to="/galaxia/$formId/nivel/$levelId" params={{ formId: galaxy.id, levelId: next.id }} className="btn-3d btn-3d-primary block text-center">
              Siguiente planeta →
            </Link>
          ) : (
            <Link to="/" className="btn-3d btn-3d-primary block text-center">
              <Trophy className="mr-2 inline size-4" /> Volver al universo
            </Link>
          )}
          <Link to="/galaxia/$formId" params={{ formId: galaxy.id }} className="btn-3d btn-3d-ghost block text-center">
            Ver constelación
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, delay }: { icon: React.ReactNode; label: string; value: string; delay: number }) {
  return (
    <div className="card-glass p-4 text-center" style={{ animation: `slide-up 0.5s ease-out ${delay}ms both` }}>
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className="font-heading text-2xl font-bold">{value}</p>
      <p className="font-sub text-[10px] uppercase tracking-widest text-cream/60">{label}</p>
    </div>
  );
}

function Badge({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="font-sub inline-flex items-center gap-1.5 rounded-full bg-amber/20 px-3 py-1 text-xs font-bold text-amber ring-1 ring-amber/40">
      <span>{icon}</span> {label}
    </span>
  );
}
