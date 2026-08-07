export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/auth';
import { guestSchema } from '@/lib/validation/auth';
import { handleApiError, jsonError } from '@/server/apiHelpers';
import { rateLimit, getClientIp } from '@/server/rateLimit';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { allowed } = rateLimit(`guest:${getClientIp(request)}`, 20, 60_000);
    if (!allowed) return jsonError('محاولات كثيرة، حاول لاحقًا', 429);

    const body = guestSchema.parse(await request.json());

    const player = await prisma.player.create({
      data: {
        isGuest: true,
        displayName: body.displayName,
        avatarEmoji: body.avatarEmoji ?? AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
        avatarColor: body.avatarColor ?? AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      },
    });

    await setSessionCookie({ playerId: player.id, userId: null, role: 'PLAYER' });

    return NextResponse.json({ player });
  } catch (error) {
    return handleApiError(error);
  }
}
