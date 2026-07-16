import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let lastCheck = new Date()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial ping
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

      const interval = setInterval(async () => {
        try {
          const newNotifs = await prisma.notification.findMany({
            where: {
              customerId: null,  // admin notifications
              createdAt: { gt: lastCheck },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
          const unreadCount = await prisma.notification.count({
            where: { customerId: null, read: false }
          })
          lastCheck = new Date()

          if (newNotifs.length > 0) {
            const payload = JSON.stringify({ type: 'notifications', notifications: newNotifs, unreadCount })
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
          } else {
            // Send heartbeat
            controller.enqueue(encoder.encode(`data: {"type":"heartbeat","unreadCount":${unreadCount}}\n\n`))
          }
        } catch {
          controller.enqueue(encoder.encode('data: {"type":"error"}\n\n'))
        }
      }, 8000) // Check every 8 seconds

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
