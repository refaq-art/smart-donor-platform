'use client';

import { Flame, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '@/lib/constants';
import type { ClientQuestion } from '@/game-engine/types';

export function ScoreHud({
  roundNumber,
  totalRounds,
  score,
  streak,
  question,
}: {
  roundNumber: number;
  totalRounds: number;
  score: number;
  streak: number;
  question: ClientQuestion;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Badge tone="primary">
          سؤال {roundNumber} / {totalRounds}
        </Badge>
        <Badge tone="neutral">
          {question.categoryIcon} {question.categoryNameAr}
        </Badge>
        <Badge style={{ borderColor: DIFFICULTY_COLORS[question.difficulty], color: DIFFICULTY_COLORS[question.difficulty] }} className="bg-transparent">
          {DIFFICULTY_LABELS[question.difficulty]}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          {streak >= 2 && (
            <motion.div
              key={streak}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-1 rounded-full bg-arena-accent/20 px-3 py-1 text-sm font-black text-arena-accent2"
            >
              <Flame size={16} />
              {streak}x
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 font-black">
          <Trophy size={16} className="text-arena-gold" />
          <motion.span key={score}>{score.toLocaleString('ar')}</motion.span>
        </div>
      </div>
    </div>
  );
}
