import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCustomerSession } from '@/lib/customer-auth'

export async function GET() {
  try {
    const session = await auth()
    const customerSession = await getCustomerSession()
    return NextResponse.json({
      session,
      customerSession,
      env: {
        hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        authUrl: process.env.AUTH_URL,
      }
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) })
  }
}
