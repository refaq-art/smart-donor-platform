'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ScoreHud } from '@/components/game/score-hud';
import { TimerBar } from '@/components/game/timer-ring';
import { AnswerPanel, type AnswerPayload } from '@/components/game/answer-panel';
import { RoundReveal } from '@/components/game/round-reveal';
import { PlayersStrip, type PlayerStripItem } from '@/components/game/players-strip';
import { FinalResults } from '@/components/game/final-results';
import { usePlayer } from '@/components/providers/player-provider';
import { useSound } from '@/components/providers/sound-provider';
import { useRoomSocket } from '@/multiplayer/useRoomSocket';
import { RoomChatPanel } from '@/components/game/room-chat-panel';
import type { ScoreBreakdown } from '@/game-engine/types';

export function RoomPlayClient({ code }: { code: string }) {
  const router = useRouter();
  const { player } = usePlayer();
  const { play } = useSound();
  const { room, round, totalRounds, roundComplete, finalResults, liveScores, reactions, spectatorCount, sendReaction, submitAnswer } = useRoomSocket(code);

  const [myResult, setMyResult] = useState<{ breakdown: ScoreBreakdown; explanationAr: string | null; selection: AnswerPayload } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const answeredRoundRef = useRef<number | null>(null);

  useEffect(() => {
    setMyResult(null);
    answeredRoundRef.current = null;
  }, [round?.roundNumber]);

  const doSubmit = useCallback(
    async (payload: AnswerPayload) => {
      if (!round || submitting || answeredRoundRef.current === round.roundNumber) return;
      setSubmitting(true);
      answeredRoundRef.current = round.roundNumber;
      try {
        const result = await submitAnswer({ roundNumber: round.roundNumber, ...payload });
        play(result.isCorrect ? 'correct' : 'wrong');
        setMyResult({ breakdown: result.breakdown, explanationAr: result.explanationAr, selection: payload });
      } catch {
        answeredRoundRef.current = null;
      } finally {
        setSubmitting(false);
      }
    },
    [round, submitAnswer, submitting, play]
  );

  const handleExpire = useCallback(() => {
    if (answeredRoundRef.current === round?.roundNumber) return;
    doSubmit({});
  }, [round, doSubmit]);

  useEffect(() => {
    if (finalResults) play('win');
  }, [finalResults, play]);

  const playersStripData: PlayerStripItem[] = useMemo(
    () =>
      (room?.players ?? []).map((p) => ({
        playerId: p.playerId,
        displayName: p.displayName,
        avatarEmoji: p.avatarEmoji,
        avatarColor: p.avatarColor,
        score: liveScores[p.playerId]?.score ?? 0,
        hasAnswered: liveScores[p.playerId]?.hasAnswered ?? false,
      })),
    [room, liveScores]
  );

  if (finalResults) {
    return <FinalResults results={finalResults} onPlayAgain={() => router.push('/room/create')} />;
  }

  if (!round) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const myScore = player ? (liveScores[player.id]?.score ?? 0) : 0;
  const myStreak = player ? (liveScores[player.id]?.streak ?? 0) : 0;
  const revealed = !!myResult || !!roundComplete;

  return (
    <div className="mx-auto max-w-2xl">
      <PlayersStrip players={playersStripData} />

      <Card>
        <ScoreHud roundNumber={round.roundNumber} totalRounds={totalRounds} score={myScore} streak={myStreak} question={round.question} />

        {!revealed && <TimerBar deadlineAt={round.deadlineAt} onExpire={handleExpire} />}

        <div className="mt-5 text-center">
          {round.question.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={round.question.imageUrl} alt="" className="mx-auto mb-4 max-h-56 rounded-2xl object-cover" />
          )}
          <h2 data-testid="question-text" className="text-xl font-extrabold leading-relaxed sm:text-2xl">
            {round.question.textAr}
          </h2>
        </div>

        <div className="mt-6">
          <AnswerPanel
            question={round.question}
            revealed={revealed}
            disabled={revealed || submitting}
            correctAnswerIds={roundComplete?.correctAnswerIds ?? []}
            correctOrderIds={roundComplete?.correctOrderIds ?? null}
            correctText={roundComplete?.correctText ?? null}
            mySelection={myResult?.selection ?? null}
            onSubmit={doSubmit}
          />
        </div>

        <AnimatePresence>
          {myResult && (
            <RoundReveal breakdown={myResult.breakdown} explanationAr={roundComplete?.explanationAr ?? myResult.explanationAr} autoAdvancing />
          )}
        </AnimatePresence>
      </Card>

      <div className="mt-4">
        <RoomChatPanel messages={[]} reactions={reactions} spectatorCount={spectatorCount} onSendReaction={sendReaction} />
      </div>
    </div>
  );
}
