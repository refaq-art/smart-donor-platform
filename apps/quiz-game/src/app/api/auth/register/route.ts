export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validation/auth';
import { handleApiError, jsonError } from '@/server/apiHelpers';
import { rateLimit, getClientIp } from '@/server/rateLimit';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { allowed } = rateLimit(`register:${getClientIp(request)}`, 10, 60_000);
    if (!allowed) return jsonError('محاولات كثيرة، حاول لاحقًا', 429);

    const body = registerSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) return jsonError('هذا البريد الإلكتروني مسجّل بالفعل', 409);

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash,
        player: {
          create: {
            isGuest: false,
            displayName: body.displayName,
            avatarEmoji: body.avatarEmoji ?? AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
            avatarColor: body.avatarColor ?? AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          },
        },
      },
      include: { player: true },
    });

    await setSessionCookie({ playerId: user.player!.id, userId: user.id, role: user.role });

    return NextResponse.json({ player: user.player });
  } catch (error) {
    return handleApiError(error);
  }
}
