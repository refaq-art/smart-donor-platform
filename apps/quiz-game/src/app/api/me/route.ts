export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, setSessionCookie } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validation/auth';
import { handleApiError, jsonError } from '@/server/apiHelpers';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ player: null });

  const player = await prisma.player.findUnique({ where: { id: session.playerId } });
  if (!player) return NextResponse.json({ player: null });

  return NextResponse.json({ player, role: session.role, isGuest: player.isGuest });
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError('يجب تسجيل الدخول أولًا', 401);

    const body = updateProfileSchema.parse(await request.json());
    const player = await prisma.player.update({ where: { id: session.playerId }, data: body });

    return NextResponse.json({ player });
  } catch (error) {
    return handleApiError(error);
  }
}
