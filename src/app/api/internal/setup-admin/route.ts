import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const SECRET = 'b1c14b41a049add9601dae381a919b8ee797e496eada774d2fbfaf0ef2164145'

export async function POST(req: NextRequest) {
  const { token, email, password, name } = await req.json()
  if (token !== SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, name, active: true },
    create: { email, password: hashed, name, role: 'SUPER_ADMIN', active: true },
  })
  return NextResponse.json({ ok: true, id: user.id, email: user.email })
}
