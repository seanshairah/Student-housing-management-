"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mobile-only floating "Book a room" button, bottom-center. Hides on scroll up. */
export function FloatingBookCta() {
  const [visible, setVisible] = React.useState(true);
  const lastY = React.useRef(0);

  React.useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      // Show when scrolling down (and past hero), hide when scrolling up.
      if (y < 240) setVisible(true);
      else setVisible(y > lastY.current);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Link
      href="/book"
      aria-label="Book a room"
      className={cn(
        "fixed inset-x-4 bottom-5 z-40 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-brand-900/20 transition-all duration-300 lg:hidden",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-24 opacity-0",
      )}
    >
      Book a room
      <ArrowRight className="size-4" />
    </Link>
  );
}
