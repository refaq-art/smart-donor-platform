'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Zap, Flame, Star, MinusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ScoreBreakdown } from '@/game-engine/types';

export function RoundReveal({
  breakdown,
  explanationAr,
  onNext,
  nextLabel,
  autoAdvancing,
}: {
  breakdown: ScoreBreakdown;
  explanationAr: string | null;
  onNext?: () => void;
  nextLabel?: string;
  autoAdvancing?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-center"
    >
      {breakdown.isCorrect ? (
        <div className="flex items-center gap-2 text-2xl font-black text-arena-success">
          <CheckCircle2 size={28} /> إجابة صحيحة!
        </div>
      ) : (
        <div className="flex items-center gap-2 text-2xl font-black text-arena-danger">
          <XCircle size={28} /> إجابة خاطئة
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-white/70">
        {breakdown.isCorrect && (
          <>
            <span className="flex items-center gap-1">
              <Zap size={14} className="text-arena-accent2" /> {breakdown.pointsFromSpeed.toLocaleString('ar')} نقطة سرعة
            </span>
            {breakdown.streakBonus > 0 && (
              <span className="flex items-center gap-1">
                <Flame size={14} className="text-arena-accent2" /> +{breakdown.streakBonus} سلسلة
              </span>
            )}
            {breakdown.firstCorrectBonus > 0 && (
              <span className="flex items-center gap-1">
                <Star size={14} className="text-arena-gold" /> +{breakdown.firstCorrectBonus} أول إجابة صحيحة
              </span>
            )}
          </>
        )}
        {breakdown.penalty > 0 && (
          <span className="flex items-center gap-1 text-arena-danger">
            <MinusCircle size={14} /> -{breakdown.penalty} خصم
          </span>
        )}
      </div>

      <div className="text-3xl font-black">
        {breakdown.total >= 0 ? '+' : ''}
        {breakdown.total.toLocaleString('ar')}
      </div>

      {explanationAr && <p className="max-w-md text-sm text-white/60">💡 {explanationAr}</p>}

      {autoAdvancing ? (
        <div className="flex items-center gap-2 text-sm font-bold text-white/50">
          <Loader2 size={16} className="animate-spin" /> السؤال التالي تلقائيًا...
        </div>
      ) : (
        onNext && (
          <Button data-testid="round-next" size="lg" onClick={onNext}>
            {nextLabel}
          </Button>
        )
      )}
    </motion.div>
  );
}
