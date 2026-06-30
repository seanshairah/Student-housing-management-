"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Playful login mascots, modelled on the reference video:
 *  - FLAT solid-colour shapes of different heights, overlapping in a cluster
 *  - they FLY IN from different directions on load, then settle
 *  - continuous whole-BODY motion (bounce + sway + squash), not just eyes
 *  - googly eyes follow the cursor / look toward the form, and the characters
 *    cover their eyes for the password (one cheeky one peeks)
 */
export type MascotMode = "idle" | "typing" | "hidden";

const MAX = 3; // px the pupils can travel inside an eye

function Eye({ covered, gx, gy }: { covered: boolean; gx: number; gy: number }) {
  return (
    <div className="relative size-3.5 overflow-hidden rounded-full bg-white">
      <span
        className="absolute left-1/2 top-1/2 size-2 rounded-full bg-stone-900 transition-[transform,opacity] duration-150 ease-out"
        style={{
          transform: covered
            ? "translate(-50%, -50%) scale(0)"
            : `translate(calc(-50% + ${gx}px), calc(-50% + ${gy}px))`,
        }}
      />
      <span
        className={cn(
          "absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-stone-900 transition-transform duration-300 ease-out",
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
  mouth = true,
}: {
  mode: MascotMode;
  gx: number;
  gy: number;
  peek?: boolean;
  dark?: boolean;
  mouth?: boolean;
}) {
  const covered = mode === "hidden";
  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* arms swing up to cover the eyes for the password */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 z-20 flex justify-center gap-[18px] transition-all duration-300 ease-out",
          covered ? "-top-2 opacity-100" : "top-2 opacity-0",
        )}
      >
        <span className={cn("block h-1.5 w-4 -rotate-[20deg] rounded-full", dark ? "bg-white/80" : "bg-black/70")} />
        <span className={cn("block h-1.5 w-4 rotate-[20deg] rounded-full", dark ? "bg-white/80" : "bg-black/70")} />
      </div>
      <div className="flex gap-1.5" style={{ animation: "mascot-blink 4.2s ease-in-out infinite" }}>
        <Eye covered={covered} gx={gx} gy={gy} />
        <Eye covered={covered && !peek} gx={gx} gy={gy} />
      </div>
      {mouth && (
        <span
          className={cn(
            "block rounded-full transition-all duration-300",
            dark ? "bg-white/70" : "bg-stone-900/60",
            covered ? "size-1" : "h-[3px] w-2.5",
          )}
        />
      )}
    </div>
  );
}

function Char({
  shape,
  facePad,
  className,
  entrance,
  idleDur,
  idleDelay,
  mode,
  gx,
  gy,
  reaction,
  peek,
  dark,
  mouth,
}: {
  shape: string;
  facePad: string;
  className?: string;
  entrance: string; // animation-name for the fly-in
  idleDur: string;
  idleDelay: string;
  mode: MascotMode;
  gx: number;
  gy: number;
  reaction: string; // transform applied for the current mode
  peek?: boolean;
  dark?: boolean;
  mouth?: boolean;
}) {
  return (
    // L1 — entrance (fly in once, hold final state)
    <div
      className={cn("shrink-0", className)}
      style={{ animation: `${entrance} 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both` }}
    >
      {/* L2 — mode reaction (lean toward form / duck for password) */}
      <div
        className="origin-bottom transition-transform duration-300 ease-out"
        style={{ transform: reaction }}
      >
        {/* L3 — continuous whole-body idle motion */}
        <div
          className="origin-bottom"
          style={{ animation: `mascot-idle ${idleDur} ease-in-out ${idleDelay} infinite` }}
        >
          {/* the body shape */}
          <div className={cn("relative flex items-start justify-center", shape)}>
            <div className={cn("relative z-10", facePad)}>
              <Face mode={mode} gx={gx} gy={gy} peek={peek} dark={dark} mouth={mouth} />
            </div>
          </div>
        </div>
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

  let gx = gaze.x * MAX;
  let gy = gaze.y * MAX;
  if (mode === "typing") {
    gx = isDesktop ? MAX : 0;
    gy = isDesktop ? MAX * 0.4 : MAX;
  }

  // Whole-body reaction: lean toward the form while typing, duck for password.
  const reaction =
    mode === "hidden"
      ? "translateY(5px) scaleY(0.9)"
      : mode === "typing"
        ? isDesktop
          ? "translateX(5px) rotate(5deg)"
          : "translateY(4px) rotate(2deg)"
        : "none";

  const shared = { mode, gx, gy, reaction };

  return (
    <div ref={ref} className="flex items-end justify-center">
      {/* tall violet rounded rectangle (back) */}
      <Char
        {...shared}
        shape="h-36 w-[72px] rounded-[1.3rem] bg-violet-500"
        facePad="pt-6"
        entrance="mascot-in-top"
        idleDur="3.2s"
        idleDelay="0.9s"
      />
      {/* big orange semicircle (front-left) */}
      <Char
        {...shared}
        shape="h-[68px] w-32 rounded-t-full bg-orange-400"
        facePad="pt-5"
        className="-ml-9 z-20"
        entrance="mascot-in-bottom"
        idleDur="3.6s"
        idleDelay="1.05s"
      />
      {/* tall black rounded rectangle (middle) */}
      <Char
        {...shared}
        dark
        mouth={false}
        shape="h-28 w-[60px] rounded-[1.3rem] bg-stone-900"
        facePad="pt-6"
        className="-ml-6 z-10"
        entrance="mascot-in-top"
        idleDur="3.9s"
        idleDelay="1.2s"
      />
      {/* yellow rounded square — the cheeky peeker (front-right) */}
      <Char
        {...shared}
        peek
        shape="h-[88px] w-[88px] rounded-[1.5rem] bg-amber-400"
        facePad="pt-5"
        className="-ml-9 z-20"
        entrance="mascot-in-right"
        idleDur="3.4s"
        idleDelay="1.3s"
      />
    </div>
  );
}
