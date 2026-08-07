export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { beginTurn } from '@/server/game/beginTurn';
import { handleApiError, requireSession } from '@/server/apiHelpers';

const schema = z.object({ sessionId: z.string(), roundNumber: z.number().int().positive() });

export async function POST(request: Request, { params }: { params: { gameId: string } }) {
  try {
    await requireSession();
    const body = schema.parse(await request.json());
    const result = await beginTurn(params.gameId, body.sessionId, body.roundNumber);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
