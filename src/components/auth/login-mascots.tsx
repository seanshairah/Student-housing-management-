"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Playful, interactive login mascots (just for fun) — an overlapping cluster of
 * characters of different shapes and heights, like the reference design.
 *  - idle    → their googly eyes FOLLOW your cursor
 *  - typing  → they look TOWARD the form (right on desktop where the form is
 *              beside them, down on mobile where the form is below them)
 *  - hidden  → they cover their eyes while you type your password
 *              (one cheeky character peeks!)
 * Plus gentle idle bobbing, blinking, mouths and rosy cheeks.
 */
export type MascotMode = "idle" | "typing" | "hidden";

const MAX = 2.6; // px the pupils can travel inside an eye

function Eye({ covered, gx, gy }: { covered: boolean; gx: number; gy: number }) {
  return (
    <div className="relative size-3 overflow-hidden rounded-full bg-white ring-1 ring-black/10">
      <span
        className="absolute left-1/2 top-1/2 size-[7px] rounded-full bg-stone-900 transition-[transform,opacity] duration-150 ease-out"
        style={{
          transform: covered
            ? "translate(-50%, -50%) scale(0)"
            : `translate(calc(-50% + ${gx}px), calc(-50% + ${gy}px))`,
        }}
      />
      {!covered && (
        <span className="absolute left-[3px] top-[2px] size-[2px] rounded-full bg-white/90" />
      )}
      <span
        className={cn(
          "absolute inset-x-0 top-1/2 h-[2.5px] -translate-y-1/2 rounded-full bg-stone-900 transition-transform duration-300 ease-out",
          covered ? "scale-x-100" : "scale-x-0",
        )}
      />
    </div>
  );
}

function Face({
  mode,
  gx,
  gy,
  peek = false,
  dark = false,
}: {
  mode: MascotMode;
  gx: number;
  gy: number;
  peek?: boolean;
  dark?: boolean;
}) {
  const covered = mode === "hidden";
  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* arms swing up over the eyes when covering */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 z-20 flex justify-center gap-[18px] transition-all duration-300 ease-out",
          covered ? "-top-2 opacity-100" : "top-2 opacity-0",
        )}
      >
        <span className={cn("block h-1.5 w-4 -rotate-12 rounded-full", dark ? "bg-white/80" : "bg-black/70")} />
        <span className={cn("block h-1.5 w-4 rotate-12 rounded-full", dark ? "bg-white/80" : "bg-black/70")} />
      </div>
      <div className="flex gap-1.5" style={{ animation: "mascot-blink 4.2s ease-in-out infinite" }}>
        <Eye covered={covered} gx={gx} gy={gy} />
        <Eye covered={covered && !peek} gx={gx} gy={gy} />
      </div>
      <span
        className={cn(
          "block rounded-b-full border-b-2 transition-all duration-300",
          dark ? "border-white/70" : "border-stone-900/60",
          covered ? "h-1 w-1.5 rounded-full" : "h-1.5 w-3",
        )}
      />
    </div>
  );
}

function Cheeks({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-1.5 flex justify-between", className)}>
      <span className="size-1.5 rounded-full bg-rose-400/50" />
      <span className="size-1.5 rounded-full bg-rose-400/50" />
    </div>
  );
}

function Char({
  shape,
  facePad,
  className,
  delay,
  mode,
  gx,
  gy,
  peek,
  dark,
  cheeks,
}: {
  shape: string;
  facePad: string;
  className?: string;
  delay: string;
  mode: MascotMode;
  gx: number;
  gy: number;
  peek?: boolean;
  dark?: boolean;
  cheeks?: boolean;
}) {
  return (
    <div
      className={cn("relative flex shrink-0 items-start justify-center shadow-sm", shape, className)}
      style={{ animation: `mascot-float 3.6s ease-in-out ${delay} infinite` }}
    >
      {cheeks && <Cheeks className={facePad} />}
      <div className={cn("relative z-10", facePad)}>
        <Face mode={mode} gx={gx} gy={gy} peek={peek} dark={dark} />
      </div>
    </div>
  );
}

export function LoginMascots({ mode }: { mode: MascotMode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (mode !== "idle") return;
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = Math.max(-1, Math.min(1, ((e.clientX - cx) / window.innerWidth) * 2.4));
      const ny = Math.max(-1, Math.min(1, ((e.clientY - cy) / window.innerHeight) * 2.4));
      setGaze({ x: nx, y: ny });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mode]);

  // typing → look toward the form (right on desktop, down on mobile)
  let gx = gaze.x * MAX;
  let gy = gaze.y * MAX;
  if (mode === "typing") {
    gx = isDesktop ? MAX : 0;
    gy = isDesktop ? MAX * 0.35 : MAX;
  }

  const shared = { mode, gx, gy };

  return (
    <div ref={ref} className="flex items-end justify-center">
      {/* tall violet block (back) */}
      <Char
        {...shared}
        shape="h-36 w-20 rounded-t-[2.2rem] rounded-b-xl bg-gradient-to-b from-violet-400 to-violet-600"
        facePad="pt-5"
        delay="0s"
        cheeks
      />
      {/* orange semicircle (front-left, wide) */}
      <Char
        {...shared}
        shape="h-16 w-28 rounded-t-full bg-gradient-to-b from-orange-300 to-orange-500"
        facePad="pt-4"
        className="-ml-7 z-20"
        delay="0.5s"
      />
      {/* dark tall blob */}
      <Char
        {...shared}
        dark
        shape="h-28 w-16 rounded-[42%] bg-gradient-to-b from-stone-700 to-stone-900"
        facePad="pt-5"
        className="-ml-6 z-10"
        delay="0.9s"
      />
      {/* yellow blob — the cheeky peeker (front-right) */}
      <Char
        {...shared}
        peek
        cheeks
        shape="h-20 w-20 rounded-t-[60%] rounded-b-2xl bg-gradient-to-b from-amber-300 to-amber-500"
        facePad="pt-4"
        className="-ml-7 z-20"
        delay="1.3s"
      />
    </div>
  );
}
