export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { nameAr: 'asc' },
    include: { _count: { select: { questions: { where: { status: 'ACTIVE' } } } } },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      key: c.key,
      nameAr: c.nameAr,
      icon: c.icon,
      colorHex: c.colorHex,
      description: c.description,
      questionCount: c._count.questions,
    })),
  });
}
