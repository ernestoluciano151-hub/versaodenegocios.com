import { NextResponse } from 'next/server'

// Notificações são geradas dinamicamente — "lidas/eliminadas" ficam no client state
export async function PATCH() {
  return NextResponse.json({ ok: true })
}
export async function DELETE() {
  return NextResponse.json({ ok: true })
}
