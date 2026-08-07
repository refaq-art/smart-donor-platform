export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { joinRoom, RoomJoinError } from '@/server/room/joinRoom';
import { getRoomByCode, toRoomView } from '@/server/room/getRoomState';
import { handleApiError, jsonError, requireSession } from '@/server/apiHelpers';

export async function POST(_request: Request, { params }: { params: { code: string } }) {
  try {
    const session = await requireSession();
    await joinRoom(params.code, session.playerId);
    const room = await getRoomByCode(params.code);
    if (!room) return jsonError('لا توجد غرفة بهذا الرمز', 404);
    return NextResponse.json({ room: toRoomView(room) });
  } catch (error) {
    if (error instanceof RoomJoinError) return jsonError(error.message, 400);
    return handleApiError(error);
  }
}
