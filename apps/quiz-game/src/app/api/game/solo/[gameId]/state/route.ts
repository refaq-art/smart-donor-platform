export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getGameState } from '@/server/game/state';
import { handleApiError, requireSession } from '@/server/apiHelpers';

export async function GET(_request: Request, { params }: { params: { gameId: string } }) {
  try {
    await requireSession();
    const state = await getGameState(params.gameId);
    return NextResponse.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
