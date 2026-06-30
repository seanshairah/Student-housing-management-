"use client";

import { cn } from "@/lib/utils";

/**
 * Playful login mascots (just for fun).
 *  - "typing"  → the characters look UP toward the form while you fill it in
 *  - "hidden"  → they cover their eyes when you're typing your password
 *               (one cheeky character peeks!)
 *  - "idle"    → they look straight ahead
 */
export type MascotMode = "idle" | "typing" | "hidden";

function Eyes({
  mode,
  peek = false,
}: {
  mode: MascotMode;
  peek?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {[0, 1].map((i) => {
        // The cheeky character keeps its 2nd eye open even while "hiding".
        const covered = mode === "hidden" && !(peek && i === 1);
        const looking = mode === "typing";
        return (
          <div
            key={i}
            className="relative size-3 overflow-hidden rounded-full bg-white ring-1 ring-black/5"
          >
            {/* pupil */}
            <span
              className={cn(
                "absolute left-1/2 top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-900 transition-transform duration-300 ease-out",
                looking && "-translate-y-[120%]",
                covered && "scale-0",
              )}
            />
            {/* eyelid that closes when covered */}
            <span
              className={cn(
                "absolute inset-x-0 top-1/2 h-[2.5px] -translate-y-1/2 rounded-full bg-stone-900 transition-transform duration-300 ease-out",
                covered ? "scale-x-100" : "scale-x-0",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Little arms that swing up to cover the eyes during password entry. */
function Arms({ active, className }: { active: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 flex justify-center gap-5 transition-all duration-300 ease-out",
        active ? "-top-1 opacity-100" : "top-3 opacity-0",
        className,
      )}
    >
      <span className="block h-1.5 w-4 -rotate-12 rounded-full bg-black/70" />
      <span className="block h-1.5 w-4 rotate-12 rounded-full bg-black/70" />
    </div>
  );
}

export function LoginMascots({ mode }: { mode: MascotMode }) {
  const hiding = mode === "hidden";

  return (
    <div className="relative mb-6 flex h-28 items-end justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-b from-muted/70 to-muted/20 px-5">
      {/* violet tall block */}
      <div className="relative flex h-[72px] w-12 items-start justify-center rounded-2xl bg-violet-500 pt-2.5">
        <Eyes mode={mode} />
        <Arms active={hiding} />
      </div>

      {/* orange semicircle */}
      <div className="relative flex h-12 w-20 items-start justify-center rounded-t-full bg-orange-400 pt-3">
        <Eyes mode={mode} />
        <Arms active={hiding} />
      </div>

      {/* dark blob */}
      <div className="relative flex h-16 w-12 items-start justify-center rounded-[40%] bg-stone-800 pt-3">
        <Eyes mode={mode} />
        <Arms active={hiding} className="[&>span]:bg-white/80" />
      </div>

      {/* yellow blob — the cheeky one that peeks */}
      <div className="relative flex h-14 w-16 items-start justify-center rounded-t-[60%] rounded-b-2xl bg-amber-400 pt-3">
        <Eyes mode={mode} peek />
      </div>
    </div>
  );
}
