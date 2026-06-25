"use client";

import { useEffect, useRef, useState } from "react";

// Renders the real value server-side (correct even without JS) and animates a
// count-up on mount. Does NOT depend on scroll/IntersectionObserver, so the
// number always ends up right (the old main.js counter only fired on scroll).
export default function CountUp({
  value,
  suffix = "",
  duration = 900,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    let raf = 0;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <>
      {display}
      {suffix}
    </>
  );
}
