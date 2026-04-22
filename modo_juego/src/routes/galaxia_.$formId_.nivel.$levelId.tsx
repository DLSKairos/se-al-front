import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { X, Check } from "lucide-react";
import { GALAXIES, useGame } from "@/game/store";

interface Question {
  id: string;
  prompt: string;
  hint: string;
  type: "choice" | "multi" | "text" | "yesno";
  options?: { id: string; label: string; emoji?: string }[];
  correct: string | string[];
  explanation: string;
}

export const Route = createFileRoute("/galaxia_/$formId_/nivel/$levelId")({
  component: LevelPlay,
});

function getQuestions(levelId: string): Question[] {
  const PACK: Record<string, Question[]> = {
    "pt-1": [
      { id: "q1", prompt: "¿Quién solicita el permiso de trabajo?", hint: "Es la persona responsable de la cuadrilla.", type: "choice", options: [{ id: "sup", label: "Supervisor de obra", emoji: "👷" }, { id: "vis", label: "Visitante", emoji: "🧑‍🦱" }, { id: "ger", label: "Gerente general", emoji: "👔" }], correct: "sup", explanation: "El supervisor de obra es quien solicita y firma el permiso." },
      { id: "q2", prompt: "Escribe el nombre del área donde se realizará el trabajo", hint: "Por ejemplo: 'Planta de envasado, línea 3'.", type: "text", correct: "*", explanation: "Localizar el trabajo permite alertar a otras áreas." },
      { id: "q3", prompt: "¿La fecha y hora de inicio están definidas?", hint: "Sin fecha y hora no hay trazabilidad.", type: "yesno", correct: "yes", explanation: "Toda tarea autorizada debe tener fecha y hora exacta." },
    ],
    "pt-2": [
      { id: "q1", prompt: "¿Qué tipo de trabajo es este?", hint: "Mira los íconos: ¿hay fuego o herramientas?", type: "choice", options: [{ id: "frio", label: "Trabajo en frío", emoji: "❄️" }, { id: "caliente", label: "Trabajo en caliente", emoji: "🔥" }, { id: "altura", label: "Trabajo en altura", emoji: "🪜" }, { id: "confinado", label: "Espacio confinado", emoji: "🕳️" }], correct: "caliente", explanation: "Soldadura, corte y esmerilado son trabajos en caliente." },
      { id: "q2", prompt: "Selecciona TODAS las herramientas a usar", hint: "Multi-selección. Toca varias.", type: "multi", options: [{ id: "sold", label: "Soldadora", emoji: "⚡" }, { id: "esme", label: "Esmeril", emoji: "🛠️" }, { id: "lap", label: "Laptop", emoji: "💻" }, { id: "cort", label: "Cortadora", emoji: "✂️" }], correct: ["sold", "esme", "cort"], explanation: "La laptop no aplica para trabajos en planta." },
    ],
    "pt-3": [
      { id: "q1", prompt: "¿Cuál es el riesgo PRINCIPAL en trabajo en caliente?", hint: "Piensa en chispas + materiales cercanos.", type: "choice", options: [{ id: "ruido", label: "Ruido excesivo", emoji: "🔊" }, { id: "incendio", label: "Incendio o explosión", emoji: "🔥" }, { id: "frio", label: "Hipotermia", emoji: "🥶" }], correct: "incendio", explanation: "Las chispas pueden encender material combustible cercano." },
      { id: "q2", prompt: "¿Hay extintor a menos de 5 metros del área?", hint: "Sin extintor cercano, no hay autorización.", type: "yesno", correct: "yes", explanation: "Norma básica: extintor accesible y operativo." },
    ],
    "pt-4": [
      { id: "q1", prompt: "Selecciona el EPP obligatorio para soldadura", hint: "Cara, manos y cuerpo.", type: "multi", options: [{ id: "casco", label: "Careta de soldar", emoji: "🥽" }, { id: "mand", label: "Mandil de cuero", emoji: "🦺" }, { id: "guant", label: "Guantes", emoji: "🧤" }, { id: "shorts", label: "Shorts", emoji: "🩳" }], correct: ["casco", "mand", "guant"], explanation: "Nada de ropa que exponga piel a chispas." },
    ],
    "pt-5": [
      { id: "q1", prompt: "¿Qué procedimiento aísla las energías peligrosas?", hint: "Dos palabras famosas en seguridad.", type: "choice", options: [{ id: "loto", label: "LOTO (Lockout/Tagout)", emoji: "🔒" }, { id: "5s", label: "5S", emoji: "🧹" }, { id: "kanban", label: "Kanban", emoji: "📋" }], correct: "loto", explanation: "LOTO bloquea físicamente y etiqueta la fuente de energía." },
      { id: "q2", prompt: "¿Verificaste energía cero antes de iniciar?", hint: "Probar-probar-probar.", type: "yesno", correct: "yes", explanation: "Siempre verificar con instrumento, nunca asumir." },
      { id: "q3", prompt: "Describe brevemente cómo bloqueaste la energía", hint: "Ej: 'Candado personal en interruptor principal'.", type: "text", correct: "*", explanation: "La trazabilidad por escrito protege a tu equipo." },
    ],
    "pt-6": [
      { id: "q1", prompt: "¿Quién debe firmar el cierre del permiso?", hint: "Debe haber al menos dos partes.", type: "multi", options: [{ id: "ejec", label: "Ejecutante", emoji: "👷" }, { id: "sup", label: "Supervisor SST", emoji: "🦺" }, { id: "lim", label: "Personal de limpieza", emoji: "🧹" }], correct: ["ejec", "sup"], explanation: "Ejecutante y supervisor SST cierran el permiso." },
    ],
  };
  return PACK[levelId] ?? [{ id: "g1", prompt: "Completa este paso", hint: "Campo libre de demostración.", type: "text", correct: "*", explanation: "¡Bien hecho!" }];
}

function LevelPlay() {
  const { formId: formId_, levelId } = Route.useParams();
  const formId = formId_;
  const navigate = useNavigate();
  const galaxy = GALAXIES.find((g) => g.id === formId);
  const level = galaxy?.levels.find((l) => l.id === levelId);
  const questions = getQuestions(levelId);

  const { completeLevel, unlockAchievement } = useGame();

  const [step, setStep] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedback, setFeedback] = useState<null | { ok: boolean; explanation: string }>(null);
  const [shake, setShake] = useState(false);
  const [errors, setErrors] = useState(0);
  const startedAt = useRef(Date.now());
  const [choice, setChoice] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [text, setText] = useState("");

  if (!galaxy || !level) {
    return (
      <div className="bg-cosmos grid min-h-screen place-items-center text-cream">
        <div className="text-center">
          <p className="text-6xl">🛸</p>
          <h1 className="font-heading mt-4 text-2xl font-bold">Nivel no encontrado</h1>
          <Link to="/" className="btn-3d btn-3d-primary mt-6 inline-block">Volver</Link>
        </div>
      </div>
    );
  }

  const q = questions[step];
  const progress = ((step + (feedback?.ok ? 1 : 0)) / questions.length) * 100;

  const resetInputs = () => { setChoice(null); setMulti([]); setText(""); setFeedback(null); };

  const checkAnswer = () => {
    let ok = false;
    if (q.type === "choice" || q.type === "yesno") ok = choice === q.correct;
    else if (q.type === "multi") { const correct = q.correct as string[]; ok = correct.length === multi.length && correct.every((c) => multi.includes(c)); }
    else ok = text.trim().length >= 3;

    if (ok) { const nc = combo + 1; setCombo(nc); setMaxCombo(Math.max(maxCombo, nc)); }
    else {
      setCombo(0); setShake(true); setTimeout(() => setShake(false), 500);
      setErrors((n) => n + 1);
    }
    setFeedback({ ok, explanation: q.explanation });
  };

  const next = () => {
    if (step + 1 >= questions.length) {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const baseXp = level.xp;
      const comboBonus = maxCombo >= 3 ? 20 : 0;
      const totalXp = baseXp + comboBonus;
      completeLevel(galaxy.id, level.id, totalXp, 0);
      if (errors === 0) unlockAchievement("perfectionist");
      if (elapsed < 60) unlockAchievement("speedster");
      navigate({
        to: "/galaxia/$formId/victoria/$levelId",
        params: { formId: galaxy.id, levelId: level.id },
        search: { xp: totalXp, perfect: errors === 0 ? 1 : 0, combo: maxCombo, time: Math.round(elapsed) },
      });
      return;
    }
    setStep((s) => s + 1);
    resetInputs();
  };

  const canSubmit = q.type === "text" ? text.trim().length >= 3 : q.type === "multi" ? multi.length > 0 : choice !== null;

  return (
    <div className="bg-cosmos relative flex min-h-screen flex-col text-cream">
      <header className="mx-auto w-full max-w-md px-5 py-4">
        <div className="flex items-center gap-3">
          <Link to="/galaxia/$formId" params={{ formId: galaxy.id }} className="grid size-9 place-items-center rounded-full bg-cream/10 backdrop-blur transition hover:bg-cream/20" aria-label="Salir">
            <X className="size-4" />
          </Link>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-cream/10">
            <div className="h-full rounded-full bg-gradient-to-r from-amber to-terracotta transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {combo >= 2 && (
          <div className="mt-3 animate-pop text-center">
            <span className="font-sub inline-block rounded-full bg-gradient-to-r from-amber to-terracotta px-4 py-1 text-xs font-bold uppercase tracking-widest text-night">🔥 Combo x{combo}</span>
          </div>
        )}
      </header>

      <main key={`${q.id}-${step}`} className={`mx-auto w-full max-w-md flex-1 px-5 ${shake ? "animate-shake" : "animate-slide-up"}`}>
        <p className="font-sub mb-2 text-[11px] uppercase tracking-widest text-amber">{level.title} · Pregunta {step + 1} de {questions.length}</p>
        <h1 className="font-heading mb-6 text-2xl font-bold leading-tight">{q.prompt}</h1>

        {q.type === "choice" || q.type === "yesno" ? (
          <div className="space-y-3">
            {(q.type === "yesno" ? [{ id: "yes", label: "Sí", emoji: "✅" }, { id: "no", label: "No", emoji: "❌" }] : q.options ?? []).map((opt) => {
              const selected = choice === opt.id;
              return (
                <button key={opt.id} type="button" disabled={!!feedback} onClick={() => setChoice(opt.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition ${selected ? "border-amber bg-amber/15" : "border-cream/15 bg-cream/5 hover:border-cream/30"} ${feedback ? "opacity-80" : ""}`}>
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="font-sub flex-1 font-semibold">{opt.label}</span>
                  <span className={`grid size-6 place-items-center rounded-md border-2 text-xs font-bold ${selected ? "border-amber bg-amber text-night" : "border-cream/30 text-transparent"}`}>✓</span>
                </button>
              );
            })}
          </div>
        ) : q.type === "multi" ? (
          <div className="grid grid-cols-2 gap-3">
            {q.options?.map((opt) => {
              const selected = multi.includes(opt.id);
              return (
                <button key={opt.id} type="button" disabled={!!feedback}
                  onClick={() => setMulti((arr) => arr.includes(opt.id) ? arr.filter((x) => x !== opt.id) : [...arr, opt.id])}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition ${selected ? "border-amber bg-amber/15" : "border-cream/15 bg-cream/5 hover:border-cream/30"}`}>
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="font-sub text-sm font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={!!feedback} placeholder="Escribe aquí…" rows={4} maxLength={300}
            className="w-full rounded-2xl border-2 border-cream/15 bg-cream/5 p-4 text-cream placeholder:text-cream/40 focus:border-amber focus:outline-none" />
        )}
      </main>

      <footer className="sticky bottom-0 mt-6 border-t border-cream/10 bg-night-deep/80 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          {feedback && (
            <div className={`mb-3 animate-pop rounded-2xl p-4 ${feedback.ok ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
              <p className="font-sub mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                {feedback.ok ? <><Check className="size-4" /> ¡Excelente!</> : <><X className="size-4" /> Casi</>}
              </p>
              <p className="text-sm text-cream">{feedback.explanation}</p>
            </div>
          )}
          <button type="button" onClick={feedback ? next : checkAnswer} disabled={!feedback && !canSubmit}
            className={`btn-3d w-full ${feedback?.ok ? "btn-3d-success" : "btn-3d-primary"}`}>
            {feedback ? (step + 1 >= questions.length ? "Reclamar recompensa" : "Continuar") : "Comprobar"}
          </button>
        </div>
      </footer>
    </div>
  );
}
