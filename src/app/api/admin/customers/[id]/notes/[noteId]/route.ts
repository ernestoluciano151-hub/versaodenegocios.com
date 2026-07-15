import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { noteId } = await params

  const note = await prisma.customerNote.findUnique({
    where: { id: noteId },
    select: { id: true },
  })

  if (!note) {
    return NextResponse.json({ error: 'Nota não encontrada.' }, { status: 404 })
  }

  await prisma.customerNote.delete({ where: { id: noteId } })

  return NextResponse.json({ message: 'Nota eliminada com sucesso.' })
}
