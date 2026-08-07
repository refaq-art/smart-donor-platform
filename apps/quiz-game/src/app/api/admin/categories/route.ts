export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categoryInputSchema } from '@/lib/validation/question';
import { handleApiError, jsonError, requireAdmin } from '@/server/apiHelpers';

export async function GET() {
  try {
    await requireAdmin();
    const categories = await prisma.category.findMany({
      orderBy: { nameAr: 'asc' },
      include: { _count: { select: { questions: true } } },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = categoryInputSchema.parse(await request.json());

    const existing = await prisma.category.findUnique({ where: { key: body.key } });
    if (existing) return jsonError('هذا المفتاح مستخدَم بالفعل', 409);

    const category = await prisma.category.create({ data: body });
    return NextResponse.json({ category });
  } catch (error) {
    return handleApiError(error);
  }
}
