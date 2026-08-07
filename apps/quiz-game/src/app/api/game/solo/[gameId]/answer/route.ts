export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { submitAnswerSchema } from '@/lib/validation/game';
import { submitAnswer } from '@/server/game/submitAnswer';
import { handleApiError, requireSession } from '@/server/apiHelpers';

export async function POST(request: Request, { params }: { params: { gameId: string } }) {
  try {
    await requireSession();
    const body = submitAnswerSchema.parse(await request.json());

    const result = await submitAnswer({
      gameId: params.gameId,
      sessionId: body.sessionId,
      roundNumber: body.roundNumber,
      selectedAnswerIds: body.selectedAnswerIds,
      orderedAnswerIds: body.orderedAnswerIds,
      textAnswer: body.textAnswer,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
