"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { formatNumber } from "@/lib/utils";

export function AnimatedCounter({
  value,
  unit,
  label,
  delay = 0,
}: {
  value: number;
  unit?: string | null;
  label: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now() + delay * 1000;
    let raf: number;

    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl2 border border-forest-100 bg-white p-6 text-center shadow-card"
    >
      <div className="text-3xl font-extrabold text-forest-700 sm:text-4xl">
        {formatNumber(display)}
        {unit ? <span className="ms-1 text-lg font-bold text-gold-dark">{unit}</span> : null}
      </div>
      <div className="mt-2 text-sm font-medium text-forest-500">{label}</div>
    </motion.div>
  );
}
