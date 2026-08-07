export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getRoomByCode, toRoomView } from '@/server/room/getRoomState';
import { handleApiError, jsonError, requireSession } from '@/server/apiHelpers';

export async function GET(_request: Request, { params }: { params: { code: string } }) {
  try {
    await requireSession();
    const room = await getRoomByCode(params.code);
    if (!room) return jsonError('لا توجد غرفة بهذا الرمز', 404);
    return NextResponse.json({ room: toRoomView(room) });
  } catch (error) {
    return handleApiError(error);
  }
}
