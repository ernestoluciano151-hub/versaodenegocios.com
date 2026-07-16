import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Webhook receiver for payment gateway integrations.
 *
 * Security model:
 * - Every provider must supply a shared secret in env (WEBHOOK_SECRET_<PROVIDER>).
 * - The raw request body is verified via HMAC-SHA256 before any processing.
 * - Unknown providers and invalid signatures always return 400 — no information leakage.
 */

/** Constant-time HMAC comparison to prevent timing attacks. */
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  // Signatures may arrive as "sha256=<hex>" or plain hex
  const incoming = signature.startsWith('sha256=') ? signature.slice(7) : signature
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(incoming, 'hex'))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider')
  const signature = req.headers.get('x-signature') ?? req.headers.get('x-webhook-signature') ?? ''

  // Read raw body for HMAC verification (must happen before .json())
  const rawBody = await req.text()

  // Always 400 for unknown providers — no information about supported ones
  if (!provider) {
    return NextResponse.json({ error: 'Provider em falta.' }, { status: 400 })
  }

  // Retrieve the shared secret for this provider
  const secretEnvKey = `WEBHOOK_SECRET_${provider.toUpperCase()}`
  const secret = process.env[secretEnvKey]

  if (!secret) {
    // Provider not configured — reject silently
    return NextResponse.json({ error: 'Provider não configurado.' }, { status: 400 })
  }

  // Verify HMAC signature before touching the payload
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  try {
    switch (provider) {
      case 'multicaixa_express': {
        // TODO: Implement Multicaixa webhook handling when credentials are available.
        // Signature is already verified above.
        // const { MulticaixaExpressProvider } = await import('@/lib/payments/multicaixa-express')
        // const instance = new MulticaixaExpressProvider()
        // await instance.handleWebhook(payload, signature)
        void payload
        break
      }
      default:
        return NextResponse.json({ error: 'Provider desconhecido.' }, { status: 400 })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Erro ao processar webhook.' }, { status: 500 })
  }
}
