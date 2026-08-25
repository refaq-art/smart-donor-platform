"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { SupportDistributionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const FALLBACK_COLORS = ["#1F4D3D", "#C8A24A", "#4E7A64", "#D9C79E", "#7EA98E"];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function DonutChart({ items }: { items: SupportDistributionItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = items.reduce((sum, i) => sum + i.percentage, 0) || 100;

  let cursor = 0;
  const segments = items.map((item, index) => {
    const sweep = (item.percentage / total) * 360;
    const startAngle = cursor;
    const endAngle = cursor + sweep;
    cursor = endAngle;
    return {
      item,
      index,
      startAngle,
      endAngle,
      color: item.color_hex || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    };
  });

  const active = activeIndex !== null ? segments[activeIndex] : null;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative h-64 w-64 shrink-0">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-0">
          {segments.map((seg) => (
            <motion.path
              key={seg.item.id}
              d={arcPath(100, 100, 78, seg.startAngle, seg.endAngle)}
              fill="none"
              stroke={seg.color}
              strokeWidth={activeIndex === seg.index ? 34 : 28}
              strokeLinecap="butt"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: seg.index * 0.15, ease: "easeOut" }}
              style={{ cursor: "pointer", transition: "stroke-width 0.2s ease" }}
              onMouseEnter={() => setActiveIndex(seg.index)}
              onClick={() => setActiveIndex(seg.index === activeIndex ? null : seg.index)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-forest-400">
            {active ? active.item.category_label : "المس أي قسم"}
          </span>
          <span className="text-2xl font-extrabold text-forest-700">
            {active ? `${active.item.percentage}%` : "100%"}
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:max-w-xs">
        {segments.map((seg) => (
          <button
            key={seg.item.id}
            onClick={() => setActiveIndex(seg.index === activeIndex ? null : seg.index)}
            onMouseEnter={() => setActiveIndex(seg.index)}
            className={cn(
              "flex items-center justify-between rounded-xl2 border px-4 py-3 text-right transition-colors",
              activeIndex === seg.index
                ? "border-gold bg-gold-light/30"
                : "border-forest-100 bg-white hover:bg-forest-50"
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-sm font-semibold text-forest-800">
                {seg.item.category_label}
              </span>
            </span>
            <span className="text-sm font-bold text-forest-600">{seg.item.percentage}%</span>
          </button>
        ))}
        {active?.item.description ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 rounded-xl2 bg-beige px-4 py-3 text-sm leading-relaxed text-forest-700"
          >
            {active.item.description}
          </motion.p>
        ) : null}
      </div>
    </div>
  );
}
