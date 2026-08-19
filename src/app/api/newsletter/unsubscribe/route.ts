import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Cancelamento de subscrição da newsletter — rota pública, de um clique.
// Antes, as campanhas diziam "recebeu este email porque subscreveu" sem
// nenhum link real de cancelamento. Isto é um dos sinais mais fortes que o
// Gmail/Yahoo usam para classificar remetentes em massa como spam (desde as
// regras de "bulk sender" de 2024 exigem unsubscribe de um clique). O `id`
// da subscrição serve de token — é um cuid não adivinhável, e o pior cenário
// possível é cancelar uma subscrição de newsletter, sem risco de segurança.
async function unsubscribe(id: string | null) {
  if (!id) return false
  const result = await prisma.newsletter.updateMany({ where: { id }, data: { active: false } })
  return result.count > 0
}

function htmlPage(message: string) {
  return `<!DOCTYPE html>
<html lang="pt-AO"><head><meta charset="utf-8"/><title>VN Commerce</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#111">
<h2>VN Commerce</h2><p>${message}</p>
</body></html>`
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  const ok = await unsubscribe(id)
  return new NextResponse(
    htmlPage(ok ? 'Subscrição cancelada com sucesso. Já não vai receber emails da nossa newsletter.' : 'Não foi possível cancelar a subscrição — link inválido.'),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

// One-click unsubscribe (RFC 8058) — usado pelo botão nativo do
// Gmail/Outlook junto ao remetente, sem abrir nenhuma página.
export async function POST(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  const ok = await unsubscribe(id)
  return NextResponse.json({ ok })
}
