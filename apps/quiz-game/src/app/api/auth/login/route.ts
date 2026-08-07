export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validation/auth';
import { handleApiError, jsonError } from '@/server/apiHelpers';
import { rateLimit, getClientIp } from '@/server/rateLimit';

export async function POST(request: Request) {
  try {
    const { allowed } = rateLimit(`login:${getClientIp(request)}`, 10, 60_000);
    if (!allowed) return jsonError('محاولات كثيرة، حاول لاحقًا', 429);

    const body = loginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { player: true },
    });
    if (!user || !user.player) return jsonError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return jsonError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);

    await setSessionCookie({ playerId: user.player.id, userId: user.id, role: user.role });

    return NextResponse.json({ player: user.player });
  } catch (error) {
    return handleApiError(error);
  }
}
