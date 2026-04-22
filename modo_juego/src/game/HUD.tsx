import { Sparkles } from "lucide-react";
import { useGame } from "./store";

/**
 * Floating streak indicator — rocket on the right edge of the screen
 * with a day counter underneath. Replaces the old HUD bar.
 */
export function StreakRocket() {
  const { streak } = useGame();

  return (
    <div className="pointer-events-none fixed right-3 top-1/2 z-40 -translate-y-1/2 sm:right-5">
      <div className="pointer-events-auto flex flex-col items-center gap-1.5">
        <div className="relative">
          {/* glow */}
          <div
            className="absolute inset-0 rounded-full bg-amber/40 blur-xl"
            style={{ animation: "pulse-glow 2.4s ease-in-out infinite" }}
          />
          {/* rocket capsule */}
          <div
            className="relative grid size-14 place-items-center rounded-full bg-gradient-to-br from-amber via-terracotta to-amber text-2xl shadow-[0_8px_24px_-4px_oklch(from_var(--amber)_l_c_h_/_0.6)] ring-2 ring-cream/20"
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            🚀
          </div>
          {/* trailing flame */}
          <div
            className="absolute -bottom-1 left-1/2 h-3 w-2 -translate-x-1/2 rounded-full bg-gradient-to-b from-amber to-transparent blur-[2px]"
            style={{ animation: "pulse-glow 0.6s ease-in-out infinite" }}
          />
        </div>
        <div className="flex flex-col items-center rounded-full bg-night/80 px-2.5 py-1 text-cream shadow-lg ring-1 ring-amber/40 backdrop-blur">
          <span className="font-sub text-base font-black leading-none text-amber">
            {streak}
          </span>
          <span className="font-sub text-[8px] uppercase leading-tight tracking-wider text-cream/60">
            {streak === 1 ? "día" : "días"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function XPBurst({ amount, x, y }: { amount: number; x: number; y: number }) {
  return (
    <div
      className="pointer-events-none fixed z-50 animate-xp-burst font-sub text-2xl font-bold text-amber"
      style={{ left: x, top: y, textShadow: "0 0 12px var(--amber)" }}
    >
      +{amount} <Sparkles className="inline size-5" />
    </div>
  );
}
