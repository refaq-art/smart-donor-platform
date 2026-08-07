'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ScoreHud } from './score-hud';
import { TimerBar } from './timer-ring';
import { AnswerPanel, type AnswerPayload } from './answer-panel';
import { RoundReveal } from './round-reveal';
import { FinalResults } from './final-results';
import { PlayersStrip, type PlayerStripItem } from './players-strip';
import { useSound } from '@/components/providers/sound-provider';
import type { RoundState, PlayerResultRow } from '@/server/game/types';
import type { ScoreBreakdown } from '@/game-engine/types';

export interface GamePlayerSession {
  sessionId: string;
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  localSlot: number;
}

export function GamePlayer({
  gameId,
  format,
  initialRound,
  totalRounds,
  sessions: initialSessions,
}: {
  gameId: string;
  format: 'SOLO' | 'LOCAL';
  initialRound: RoundState;
  totalRounds: number;
  sessions: GamePlayerSession[];
}) {
  const router = useRouter();
  const { play } = useSound();

  const [round, setRound] = useState(initialRound);
  const [scores, setScores] = useState<Record<string, { score: number; streak: number; eliminated: boolean }>>(() =>
    Object.fromEntries(initialSessions.map((s) => [s.sessionId, { score: 0, streak: 0, eliminated: false }]))
  );
  const [turnQueue, setTurnQueue] = useState<string[]>(() => initialSessions.map((s) => s.sessionId));
  const [answeredThisRound, setAnsweredThisRound] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'question' | 'reveal' | 'final'>('question');
  const [reveal, setReveal] = useState<{
    breakdown: ScoreBreakdown;
    correctAnswerIds: string[];
    correctOrderIds: string[] | null;
    correctText: string | null;
    explanationAr: string | null;
    mySelection: AnswerPayload;
  } | null>(null);
  const [finalResults, setFinalResults] = useState<PlayerResultRow[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pendingNextRef = useRef<{ roundComplete: boolean; nextRound: RoundState | null; gameFinished: boolean } | null>(null);

  const sessionsById = useMemo(() => Object.fromEntries(initialSessions.map((s) => [s.sessionId, s])), [initialSessions]);
  const activeSessionId = turnQueue[0];
  const activeSession = activeSessionId ? sessionsById[activeSessionId] : null;

  const submit = useCallback(
    async (payload: AnswerPayload) => {
      if (!activeSessionId || submitting) return;
      setSubmitting(true);
      try {
        if (format === 'LOCAL') {
          await fetch(`/api/game/solo/${gameId}/turn/begin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: activeSessionId, roundNumber: round.roundNumber }),
          }).catch(() => {});
        }

        const res = await fetch(`/api/game/solo/${gameId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: activeSessionId, roundNumber: round.roundNumber, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) return;

        play(data.isCorrect ? 'correct' : 'wrong');

        setScores((prev) => ({
          ...prev,
          [activeSessionId]: { score: data.newScore, streak: data.newStreak, eliminated: data.eliminated },
        }));
        setAnsweredThisRound((prev) => new Set(prev).add(activeSessionId));
        setReveal({
          breakdown: data.breakdown,
          correctAnswerIds: data.correctAnswerIds,
          correctOrderIds: data.correctOrderIds,
          correctText: data.correctText,
          explanationAr: data.explanationAr,
          mySelection: payload,
        });
        setPhase('reveal');

        if (data.gameFinished) {
          play('win');
          setFinalResults(data.finalResults);
        }

        pendingNextRef.current = { roundComplete: data.roundComplete, nextRound: data.nextRound, gameFinished: data.gameFinished };
      } finally {
        setSubmitting(false);
      }
    },
    [activeSessionId, format, gameId, play, round.roundNumber, submitting]
  );

  const goNext = useCallback(() => {
    const pending = pendingNextRef.current;

    setTurnQueue((prev) => {
      const remaining = prev.slice(1);
      if (remaining.length > 0) {
        setReveal(null);
        setPhase('question');
        return remaining;
      }

      if (pending?.gameFinished) {
        setPhase('final');
        return [];
      }

      if (pending?.nextRound) {
        setRound(pending.nextRound);
        setAnsweredThisRound(new Set());
        setReveal(null);
        setPhase('question');
        return initialSessions.filter((s) => !scores[s.sessionId]?.eliminated).map((s) => s.sessionId);
      }

      return [];
    });
  }, [initialSessions, scores, submit]);

  const handleExpire = useCallback(() => {
    if (phase !== 'question') return;
    submit({});
  }, [phase, submit]);

  const playersStripData: PlayerStripItem[] = initialSessions.map((s) => ({
    playerId: s.sessionId,
    displayName: s.displayName,
    avatarEmoji: s.avatarEmoji,
    avatarColor: s.avatarColor,
    score: scores[s.sessionId]?.score ?? 0,
    hasAnswered: answeredThisRound.has(s.sessionId),
    isActiveTurn: s.sessionId === activeSessionId,
    eliminated: scores[s.sessionId]?.eliminated,
  }));

  if (phase === 'final' && finalResults) {
    return <FinalResults results={finalResults} onPlayAgain={() => router.push('/play/setup')} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PlayersStrip players={playersStripData} />

      {format === 'LOCAL' && activeSession && phase === 'question' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 text-center text-sm font-bold text-white/60">
          دور: <span className="text-white">{activeSession.displayName}</span> {activeSession.avatarEmoji}
        </motion.div>
      )}

      <Card>
        <ScoreHud
          roundNumber={round.roundNumber}
          totalRounds={totalRounds}
          score={activeSessionId ? (scores[activeSessionId]?.score ?? 0) : 0}
          streak={activeSessionId ? (scores[activeSessionId]?.streak ?? 0) : 0}
          question={round.question}
        />

        {phase === 'question' && <TimerBar deadlineAt={round.deadlineAt} onExpire={handleExpire} />}

        <div className="mt-5 text-center">
          {round.question.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={round.question.imageUrl} alt="" className="mx-auto mb-4 max-h-56 rounded-2xl object-cover" />
          )}
          <h2 className="text-xl font-extrabold leading-relaxed sm:text-2xl">{round.question.textAr}</h2>
        </div>

        <div className="mt-6">
          <AnswerPanel
            question={round.question}
            revealed={phase === 'reveal'}
            disabled={phase === 'reveal' || submitting}
            correctAnswerIds={reveal?.correctAnswerIds ?? []}
            correctOrderIds={reveal?.correctOrderIds ?? null}
            correctText={reveal?.correctText ?? null}
            mySelection={reveal?.mySelection ?? null}
            onSubmit={submit}
          />
        </div>

        <AnimatePresence>
          {phase === 'reveal' && reveal && (
            <RoundReveal
              breakdown={reveal.breakdown}
              explanationAr={reveal.explanationAr}
              onNext={goNext}
              nextLabel={turnQueue.length > 1 ? 'اللاعب التالي' : 'السؤال التالي'}
            />
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
