export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tournamentUpdateSchema } from '@/lib/validation/tournament';
import { handleApiError, requireAdmin } from '@/server/apiHelpers';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = tournamentUpdateSchema.parse(await request.json());

    const tournament = await prisma.tournament.update({
      where: { id: params.id },
      data: {
        ...(body.nameAr !== undefined ? { nameAr: body.nameAr } : {}),
        ...(body.descriptionAr !== undefined ? { descriptionAr: body.descriptionAr } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.startAt !== undefined ? { startAt: new Date(body.startAt) } : {}),
        ...(body.endAt !== undefined ? { endAt: new Date(body.endAt) } : {}),
      },
    });
    return NextResponse.json({ tournament });
  } catch (error) {
    return handleApiError(error);
  }
}
