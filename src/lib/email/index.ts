import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
}

const FROM = process.env.EMAIL_FROM ?? 'noreply@versaodenegocios.com'
const APP_NAME = 'VN Commerce'

export async function sendOrderConfirmation(to: string, order: {
  id: string
  customerName: string
  total: number
  items: Array<{ name: string; quantity: number; price: number }>
}) {
  const itemsHtml = order.items
    .map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>Kz ${i.price.toFixed(2)}</td></tr>`)
    .join('')

  return getResend().emails.send({
    from: `${APP_NAME} <${FROM}>`,
    to,
    subject: `Pedido #${order.id.slice(-8).toUpperCase()} recebido — ${APP_NAME}`,
    html: `
      <h1>Obrigado, ${order.customerName}!</h1>
      <p>O seu pedido foi recebido e está a ser processado.</p>
      <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
        <thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><strong>Total: Kz ${order.total.toFixed(2)}</strong></p>
      <p>Entraremos em contacto brevemente para confirmar o seu pedido.</p>
    `,
  })
}

export async function sendOrderStatusUpdate(to: string, data: {
  customerName: string
  orderId: string
  status: string
  message: string
}) {
  return getResend().emails.send({
    from: `${APP_NAME} <${FROM}>`,
    to,
    subject: `Actualização do pedido #${data.orderId.slice(-8).toUpperCase()} — ${APP_NAME}`,
    html: `
      <h1>Olá, ${data.customerName}!</h1>
      <p>${data.message}</p>
      <p>Estado actual: <strong>${data.status}</strong></p>
    `,
  })
}

export async function sendCartAbandonmentEmail(to: string, data: {
  customerName: string
  cartItems: Array<{ name: string; price: number }>
  recoverUrl: string
}) {
  const itemsHtml = data.cartItems.map(i => `<li>${i.name} — Kz ${i.price.toFixed(2)}</li>`).join('')

  return getResend().emails.send({
    from: `${APP_NAME} <${FROM}>`,
    to,
    subject: `Esqueceu-se de algo? — ${APP_NAME}`,
    html: `
      <h1>Olá, ${data.customerName}!</h1>
      <p>Deixou alguns artigos no carrinho:</p>
      <ul>${itemsHtml}</ul>
      <a href="${data.recoverUrl}" style="background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:6px">
        Completar compra
      </a>
    `,
  })
}

export async function sendAdminNewOrder(data: {
  orderId: string
  customerName: string
  total: number
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? FROM
  return getResend().emails.send({
    from: `${APP_NAME} <${FROM}>`,
    to: adminEmail,
    subject: `Novo pedido #${data.orderId.slice(-8).toUpperCase()} — Kz ${data.total.toFixed(2)}`,
    html: `
      <h1>Novo pedido recebido!</h1>
      <p>Cliente: <strong>${data.customerName}</strong></p>
      <p>Total: <strong>Kz ${data.total.toFixed(2)}</strong></p>
    `,
  })
}
