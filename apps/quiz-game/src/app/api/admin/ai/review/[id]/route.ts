export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireAdmin } from '@/server/apiHelpers';

const schema = z.object({ action: z.enum(['accept', 'reject']) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { action } = schema.parse(await request.json());

    const question = await prisma.question.update({
      where: { id: params.id },
      data: { status: action === 'accept' ? 'ACTIVE' : 'REJECTED' },
    });

    return NextResponse.json({ question });
  } catch (error) {
    return handleApiError(error);
  }
}
