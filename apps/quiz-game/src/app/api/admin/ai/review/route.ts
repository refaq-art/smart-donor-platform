export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireAdmin } from '@/server/apiHelpers';

export async function GET() {
  try {
    await requireAdmin();
    const questions = await prisma.question.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: { answers: true, category: true, aiJob: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ questions });
  } catch (error) {
    return handleApiError(error);
  }
}
