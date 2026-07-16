export interface NotificationData {
  route?: string
  entityId?: string
  entityType?: string
  orderId?: string
  customerId?: string
  ticketId?: string
  status?: string
}

/** Returns the URL to navigate to when this notification is clicked (admin context) */
export function getAdminRoute(type: string, data?: NotificationData | null): string | null {
  if (data?.route) return data.route
  switch (type) {
    case 'new_custom_order':
    case 'custom_order_customer_message':
    case 'custom_order_message':
    case 'custom_order_status':
      return data?.orderId ? `/admin/encomendas-personalizadas/${data.orderId}` : '/admin/encomendas-personalizadas'
    case 'order':
    case 'order_created':
    case 'order_confirmed':
      return data?.orderId ? `/admin/pedidos/${data.orderId}` : '/admin/pedidos'
    case 'payment':
      return '/admin/pagamentos'
    case 'ticket':
    case 'support_reply':
      return data?.ticketId ? `/admin/suporte/${data.ticketId}` : '/admin/suporte'
    case 'customer':
    case 'new_customer':
      return data?.customerId ? `/admin/clientes/${data.customerId}` : '/admin/clientes'
    case 'stock':
      return '/admin/produtos'
    case 'affiliate':
      return '/admin/afiliados'
    default:
      return null
  }
}

/** Returns the URL to navigate to when this notification is clicked (customer context) */
export function getCustomerRoute(type: string, data?: NotificationData | null): string | null {
  if (data?.route) return data.route
  switch (type) {
    case 'custom_order_message':
    case 'custom_order_status':
      return '/conta/encomendas-personalizadas'
    case 'support_reply':
      return '/conta/suporte'
    case 'order_confirmed':
    case 'order_shipped':
    case 'order_delivered':
    case 'order':
      return data?.orderId ? `/conta/pedidos/${data.orderId}` : '/conta/pedidos'
    case 'payment':
      return '/conta/pagamentos'
    case 'promotion':
    case 'news':
      return '/produtos'
    default:
      return null
  }
}
