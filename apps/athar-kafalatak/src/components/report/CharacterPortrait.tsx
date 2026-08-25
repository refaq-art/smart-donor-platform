"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CharacterStage, ChildCharacterStage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CharacterPortrait({
  stages,
  stage,
  size = 220,
  className,
}: {
  stages: Record<CharacterStage, ChildCharacterStage | undefined>;
  stage: CharacterStage;
  size?: number;
  className?: string;
}) {
  const current = stages[stage];
  if (!current) return null;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.image_url}
            alt={current.alt_text}
            width={size}
            height={size}
            loading="eager"
            className="h-full w-full drop-shadow-[0_12px_24px_rgba(31,77,61,0.25)]"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
