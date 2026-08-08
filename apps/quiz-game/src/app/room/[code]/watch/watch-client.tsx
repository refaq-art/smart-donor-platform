'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Eye, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { AnswerPanel } from '@/components/game/answer-panel';
import { PlayersStrip, type PlayerStripItem } from '@/components/game/players-strip';
import { FinalResults } from '@/components/game/final-results';
import { RoomChatPanel } from '@/components/game/room-chat-panel';
import { useRoomSocket } from '@/multiplayer/useRoomSocket';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '@/lib/constants';

export function WatchRoomClient({ code }: { code: string }) {
  const {
    room,
    error,
    round,
    totalRounds,
    roundComplete,
    finalResults,
    liveScores,
    chatMessages,
    reactions,
    spectatorCount,
    sendChat,
    sendReaction,
  } = useRoomSocket(code, { spectator: true });

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

  if (error) {
    return <p className="py-20 text-center text-arena-danger">{error}</p>;
  }

  if (finalResults) {
    return <FinalResults results={finalResults} onPlayAgain={() => (window.location.href = '/room/join')} />;
  }

  if (!room) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-center gap-2 text-sm font-bold text-white/50">
        <Eye size={16} /> وضع المشاهدة — غرفة {room.code}
      </div>

      {!round ? (
        <Card className="mb-4 text-center text-white/60">
          <Users className="mx-auto mb-2 text-arena-primary2" />
          بانتظار بدء المباراة...
          <div className="mt-4 flex flex-col gap-2">
            {room.players.map((p) => (
              <div key={p.playerId} className="flex items-center justify-center gap-2">
                <span>{p.avatarEmoji}</span>
                <span className="font-bold">{p.displayName}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <>
          <PlayersStrip players={playersStripData} />
          <Card>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone="primary">
                سؤال {round.roundNumber} / {totalRounds}
              </Badge>
              <Badge tone="neutral">
                {round.question.categoryIcon} {round.question.categoryNameAr}
              </Badge>
              <Badge
                style={{ borderColor: DIFFICULTY_COLORS[round.question.difficulty], color: DIFFICULTY_COLORS[round.question.difficulty] }}
                className="bg-transparent"
              >
                {DIFFICULTY_LABELS[round.question.difficulty]}
              </Badge>
            </div>

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
                revealed={!!roundComplete}
                disabled
                correctAnswerIds={roundComplete?.correctAnswerIds ?? []}
                correctOrderIds={roundComplete?.correctOrderIds ?? null}
                correctText={roundComplete?.correctText ?? null}
                mySelection={null}
                onSubmit={() => {}}
              />
            </div>

            {roundComplete?.explanationAr && (
              <p className="mt-4 rounded-xl bg-white/5 p-3 text-center text-sm text-white/60">{roundComplete.explanationAr}</p>
            )}
          </Card>
        </>
      )}

      <div className="mt-4">
        <RoomChatPanel messages={chatMessages} reactions={reactions} spectatorCount={spectatorCount} onSendChat={sendChat} onSendReaction={sendReaction} />
      </div>

      <p className="mt-4 text-center text-xs text-white/30">
        تريد اللعب بدل المشاهدة؟{' '}
        <Link href="/room/join" className="text-arena-primary2 underline">
          انضم كلاعب
        </Link>
      </p>
    </div>
  );
}
