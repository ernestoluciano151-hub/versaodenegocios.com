import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

const SINGLETON_ID = 'singleton'
const APP_NAME = 'VN Commerce'

/**
 * Resolve a configuração de email a partir da BD (Configurações → Email,
 * gerido pelo admin) com fallback para as variáveis de ambiente
 * RESEND_API_KEY / EMAIL_FROM. Antes desta correcção, este ficheiro lia
 * SEMPRE das variáveis de ambiente e ignorava por completo o que o admin
 * configurava no painel — exactamente o mesmo tipo de bug já corrigido
 * noutras áreas (Analytics, Métodos de Pagamento): a configuração existia
 * na UI mas nunca chegava a ser usada.
 */
async function resolveEmailConfig(): Promise<{ apiKey: string; from: string; supportEmail?: string }> {
  const settings = await prisma.emailSettings.findUnique({ where: { id: SINGLETON_ID } }).catch(() => null)

  const apiKey = settings?.apiKey || process.env.RESEND_API_KEY || ''
  const fromEmail = settings?.fromEmail || process.env.EMAIL_FROM || 'noreply@versaodenegocios.com'
  const fromName = settings?.fromName || APP_NAME

  return { apiKey, from: `${fromName} <${fromEmail}>`, supportEmail: settings?.supportEmail ?? undefined }
}

/**
 * Moldura HTML partilhada por todos os emails transaccionais. Antes, os
 * emails de pedido (confirmação, envio, actualização de estado) usavam HTML
 * "cru" — <h1> sem estilo, <table border="1" cellpadding="8">, sem rodapé —
 * enquanto o email de recuperação de palavra-passe já usava um template com
 * CSS inline, botão estilizado e rodapé de marca. Essa diferença de aspecto
 * é exactamente o tipo de sinal que os filtros de conteúdo do Gmail/Outlook
 * usam para pontuar mensagens como suspeitas: HTML antigo e sem marca "cheira"
 * a spam, um template consistente e bem formatado "cheira" a transaccional
 * legítimo. Uniformizar todos os templates com esta moldura ajuda a
 * consistência de entrega — mas a verificação de domínio (SPF/DKIM/DMARC) no
 * Resend continua a ser o factor mais determinante.
 */
function wrapEmail(bodyHtml: string): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="color:#999;font-size:12px">${APP_NAME} — Produtos Eletrónicos</p>
    </div>
  `
}

interface SendPayload {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

/**
 * Envio central de email. Antes, cada chamador ignorava o campo `error` que
 * a Resend devolve (a SDK NÃO lança excepção em falhas da API — chave
 * inválida, domínio não verificado, etc. — devolve { data: null, error }).
 * Como nenhum código verificava esse campo, todos os blocos try/catch
 * existentes nunca detectavam a falha: os emails simplesmente não saíam,
 * sem qualquer erro visível. Agora verificamos sempre `error`, registamos
 * com logError (visível nos logs da Vercel) e lançamos excepção real, para
 * que o try/catch dos chamadores passe a funcionar como esperado.
 */
async function sendEmail(payload: SendPayload): Promise<void> {
  const { apiKey, from } = await resolveEmailConfig()

  if (!apiKey) {
    const err = new Error('Serviço de email não configurado — falta a API Key da Resend (Configurações → Email ou variável RESEND_API_KEY).')
    logError(err, 'email:no-api-key')
    throw err
  }

  const resend = new Resend(apiKey)
  // Enviar sempre também uma versão em texto simples — emails só-HTML (sem
  // alternativa "text/plain") são um sinal comum usado pelos filtros de
  // spam do Gmail/Outlook para penalizar a pontuação da mensagem.
  const text = payload.html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const { error } = await resend.emails.send({ from, ...payload, text })

  if (error) {
    const err = new Error(`Falha ao enviar email (${error.name}): ${error.message}`)
    logError(err, 'email:send-failed')
    throw err
  }
}

export async function sendOrderConfirmation(to: string, order: {
  id: string
  customerName: string
  total: number
  items: Array<{ name: string; quantity: number; price: number }>
}) {
  const { supportEmail } = await resolveEmailConfig()
  const itemsHtml = order.items
    .map(i => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">Kz ${i.price.toFixed(2)}</td>
      </tr>`)
    .join('')

  return sendEmail({
    to,
    replyTo: supportEmail,
    subject: `Pedido #${order.id.slice(-8).toUpperCase()} recebido — ${APP_NAME}`,
    html: wrapEmail(`
      <h2 style="color:#111">Obrigado, ${order.customerName}!</h2>
      <p>O seu pedido <strong>#${order.id.slice(-8).toUpperCase()}</strong> foi recebido e está a ser processado.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #111;font-size:12px;color:#666">Produto</th>
            <th style="text-align:center;padding:8px;border-bottom:2px solid #111;font-size:12px;color:#666">Qtd</th>
            <th style="text-align:right;padding:8px;border-bottom:2px solid #111;font-size:12px;color:#666">Preço</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="text-align:right;font-size:16px"><strong>Total: Kz ${order.total.toFixed(2)}</strong></p>
      <p>Entraremos em contacto brevemente para confirmar o seu pedido.</p>
    `),
  })
}

export async function sendOrderStatusUpdate(to: string, data: {
  customerName: string
  orderId: string
  status: string
  message: string
}) {
  const { supportEmail } = await resolveEmailConfig()
  return sendEmail({
    to,
    replyTo: supportEmail,
    subject: `Actualização do pedido #${data.orderId.slice(-8).toUpperCase()} — ${APP_NAME}`,
    html: wrapEmail(`
      <h2 style="color:#111">Olá, ${data.customerName}!</h2>
      <p>${data.message}</p>
      <p>Estado actual: <strong>${data.status}</strong></p>
    `),
  })
}

export async function sendCartAbandonmentEmail(to: string, data: {
  customerName: string
  cartItems: Array<{ name: string; price: number }>
  recoverUrl: string
}) {
  const itemsHtml = data.cartItems.map(i => `<li style="margin-bottom:4px">${i.name} — Kz ${i.price.toFixed(2)}</li>`).join('')

  return sendEmail({
    to,
    subject: `Esqueceu-se de algo? — ${APP_NAME}`,
    html: wrapEmail(`
      <h2 style="color:#111">Olá, ${data.customerName}!</h2>
      <p>Deixou alguns artigos no carrinho:</p>
      <ul style="padding-left:20px">${itemsHtml}</ul>
      <a href="${data.recoverUrl}"
        style="display:inline-block;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
        Completar compra
      </a>
    `),
  })
}

export async function sendContactEmail(to: string, data: {
  name: string
  email: string
  subject?: string
  message: string
}) {
  return sendEmail({
    to,
    replyTo: data.email,
    subject: `[Contacto] ${data.subject?.trim() || 'Nova mensagem'} — ${data.name}`,
    html: `
      <h2>Nova mensagem de contacto</h2>
      <p><strong>Nome:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      ${data.subject ? `<p><strong>Assunto:</strong> ${data.subject}</p>` : ''}
      <hr/>
      <p>${data.message.replace(/\n/g, '<br/>')}</p>
    `,
  })
}

export async function sendOrderShippedEmail(to: string, data: {
  customerName: string
  orderId: string
  trackingNumber?: string
}) {
  const { supportEmail } = await resolveEmailConfig()
  return sendEmail({
    to,
    replyTo: supportEmail,
    subject: `Pedido #${data.orderId.slice(-8).toUpperCase()} enviado — ${APP_NAME}`,
    html: wrapEmail(`
      <h2 style="color:#111">O seu pedido foi enviado! 🚚</h2>
      <p>Olá, ${data.customerName}!</p>
      <p>O seu pedido <strong>#${data.orderId.slice(-8).toUpperCase()}</strong> foi despachado.</p>
      ${data.trackingNumber ? `<p>Número de rastreio: <strong>${data.trackingNumber}</strong></p>` : ''}
      <p>Aguarde a entrega nos próximos dias úteis.</p>
      <p>Obrigado pela sua compra!</p>
    `),
  })
}

export async function sendAdminNewOrder(data: {
  orderId: string
  customerName: string
  total: number
}) {
  const settings = await prisma.emailSettings.findUnique({ where: { id: SINGLETON_ID } }).catch(() => null)
  const adminEmail = settings?.salesEmail || process.env.ADMIN_EMAIL || settings?.fromEmail || process.env.EMAIL_FROM || 'noreply@versaodenegocios.com'

  return sendEmail({
    to: adminEmail,
    subject: `Novo pedido #${data.orderId.slice(-8).toUpperCase()} — Kz ${data.total.toFixed(2)}`,
    html: wrapEmail(`
      <h2 style="color:#111">Novo pedido recebido!</h2>
      <p>Cliente: <strong>${data.customerName}</strong></p>
      <p>Total: <strong>Kz ${data.total.toFixed(2)}</strong></p>
    `),
  })
}

export async function sendPasswordResetEmail(to: string, data: {
  customerName: string
  resetUrl: string
}) {
  return sendEmail({
    to,
    subject: `Recuperação de palavra-passe — ${APP_NAME}`,
    html: wrapEmail(`
      <h2 style="color:#111">Recuperar palavra-passe</h2>
      <p>Olá, <strong>${data.customerName}</strong>!</p>
      <p>Recebemos um pedido para recuperar a palavra-passe da sua conta.</p>
      <p>Clique no botão abaixo para definir uma nova palavra-passe. O link é válido durante <strong>1 hora</strong>.</p>
      <a href="${data.resetUrl}"
        style="display:inline-block;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
        Redefinir palavra-passe
      </a>
      <p style="color:#666;font-size:13px">Se não pediu a recuperação, pode ignorar este email.</p>
    `),
  })
}
