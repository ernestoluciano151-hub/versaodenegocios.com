import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Webhook receiver for future payment gateway integrations (Multicaixa Express, etc.)
// Each provider will POST to this endpoint with their payload and signature.
export async function POST(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider')
  const signature = req.headers.get('x-signature') ?? ''
  const payload = await req.json()

  try {
    switch (provider) {
      case 'multicaixa_express': {
        // TODO: Implement Multicaixa webhook handling when credentials are available
        // const { MulticaixaExpressProvider } = await import('@/lib/payments/multicaixa-express')
        // const instance = new MulticaixaExpressProvider()
        // await instance.handleWebhook(payload, signature)
        break
      }
      default:
        return NextResponse.json({ error: 'Provider desconhecido.' }, { status: 400 })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
