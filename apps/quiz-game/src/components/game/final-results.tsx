'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Crown, Home, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/constants';
import { accuracyPercent } from '@/lib/utils';
import type { PlayerResultRow } from '@/server/game/types';

const PODIUM_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

export function FinalResults({ results, onPlayAgain }: { results: PlayerResultRow[]; onPlayAgain: () => void }) {
  const podium = results.slice(0, 3);
  const rest = results.slice(3);
  const achievementByKey = new Map<string, (typeof ACHIEVEMENT_DEFINITIONS)[number]>(ACHIEVEMENT_DEFINITIONS.map((a) => [a.key, a]));

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-black text-gradient-primary">
        🎉 انتهت المباراة!
      </motion.h1>

      <div className="flex w-full max-w-xl items-end justify-center gap-3">
        {[podium[1], podium[0], podium[2]].map((p, i) =>
          p ? (
            <motion.div
              key={p.playerId}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span className="text-4xl">{p.avatarEmoji}</span>
              <span className="text-sm font-bold">{p.displayName}</span>
              <span className="text-xs text-white/60">{p.score.toLocaleString('ar')}</span>
              <div
                className="flex w-full items-center justify-center rounded-t-2xl font-black text-arena-bg"
                style={{
                  height: p.rank === 1 ? 110 : p.rank === 2 ? 80 : 55,
                  backgroundColor: PODIUM_COLORS[p.rank - 1] ?? '#7c5cff',
                }}
              >
                {p.rank === 1 ? <Crown size={24} /> : `#${p.rank}`}
              </div>
            </motion.div>
          ) : (
            <div key={i} className="flex-1" />
          )
        )}
      </div>

      {rest.length > 0 && (
        <Card className="w-full max-w-xl">
          <div className="flex flex-col gap-2">
            {rest.map((p) => (
              <div key={p.playerId} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-white/50">#{p.rank}</span>
                  <span>{p.avatarEmoji}</span>
                  <span className="font-bold">{p.displayName}</span>
                </div>
                <span className="font-black">{p.score.toLocaleString('ar')}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="w-full max-w-xl">
        <h3 className="mb-3 font-extrabold">تفاصيل اللاعبين</h3>
        <div className="flex flex-col gap-3">
          {results.map((p) => (
            <div key={p.playerId} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span>{p.avatarEmoji}</span>
                <span className="font-bold">{p.displayName}</span>
                {p.isWinner && <span className="text-xs font-bold text-arena-gold">🏆 الفائز</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                <span>
                  {p.correctAnswers}/{p.totalAnswers} صحيحة ({accuracyPercent(p.correctAnswers, p.totalAnswers)}%)
                </span>
                <span>أفضل سلسلة: {p.bestStreak}</span>
              </div>
              {p.newAchievements.length > 0 && (
                <div className="flex w-full flex-wrap gap-2">
                  {p.newAchievements.map((key) => {
                    const def = achievementByKey.get(key);
                    if (!def) return null;
                    return (
                      <span key={key} className="flex items-center gap-1 rounded-full bg-arena-accent/20 px-2.5 py-1 text-xs font-bold text-arena-accent2">
                        {def.icon} {def.nameAr} جديد!
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onPlayAgain}>
          <RotateCcw size={16} /> العب مرة أخرى
        </Button>
        <Link href="/">
          <Button variant="outline">
            <Home size={16} /> الرئيسية
          </Button>
        </Link>
      </div>
    </div>
  );
}
