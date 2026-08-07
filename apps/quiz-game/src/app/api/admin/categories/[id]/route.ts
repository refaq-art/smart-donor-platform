export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categoryInputSchema } from '@/lib/validation/question';
import { handleApiError, jsonError, requireAdmin } from '@/server/apiHelpers';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = categoryInputSchema.partial().parse(await request.json());
    const category = await prisma.category.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ category });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const count = await prisma.question.count({ where: { categoryId: params.id } });
    if (count > 0) return jsonError('لا يمكن حذف تصنيف يحتوي على أسئلة — عطّله بدلًا من ذلك', 400);
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
