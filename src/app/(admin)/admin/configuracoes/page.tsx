export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { ConfiguracoesClient } from './components/ConfiguracoesClient'

// Helper: safely run a prisma query, returning fallback on any error (e.g. missing table)
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch { return fallback }
}

const DEFAULT_STORE = {
  id: 'singleton', companyName: 'VN Commerce', country: 'Angola',
  currency: 'AOA', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm',
  timezone: 'Africa/Luanda', logo: null, logoDark: null, logoWhite: null,
  favicon: null, phone: null, whatsapp: null, email: null, website: null,
  address: null, city: null, province: null, nif: null,
  updatedAt: new Date(),
}

export default async function ConfiguracoesPage() {
  const [
    storeSettings,
    socialSettings,
    emailSettings,
    seoSettings,
    analyticsSettings,
    themeSettings,
    paymentMethods,
    bankAccounts,
    approvalRequests,
    rolePermissions,
    users,
    auditLogs,
  ] = await Promise.all([
    safe(() => prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton', companyName: 'VN Commerce', country: 'Angola',
        currency: 'AOA', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm',
        timezone: 'Africa/Luanda',
      },
    }), DEFAULT_STORE),

    safe(() => prisma.socialSettings.upsert({
      where: { id: 'singleton' }, update: {}, create: { id: 'singleton' },
    }), { id: 'singleton', facebook: null, instagram: null, linkedin: null, tiktok: null, youtube: null, twitter: null, whatsapp: null, telegram: null, updatedAt: new Date() }),

    safe(() => prisma.emailSettings.upsert({
      where: { id: 'singleton' }, update: {},
      create: { id: 'singleton', provider: 'resend' },
    }), { id: 'singleton', provider: 'resend', apiKey: null, fromEmail: null, fromName: null, supportEmail: null, financeEmail: null, salesEmail: null, defaultTemplate: null, updatedAt: new Date() }),

    safe(() => prisma.seoSettings.upsert({
      where: { id: 'singleton' }, update: {},
      create: { id: 'singleton', robots: 'index, follow' },
    }), { id: 'singleton', siteTitle: null, siteDescription: null, keywords: null, googleVerification: null, facebookMeta: null, twitterMeta: null, robots: 'index, follow', ogImage: null, updatedAt: new Date() }),

    safe(() => prisma.analyticsSettings.upsert({
      where: { id: 'singleton' }, update: {}, create: { id: 'singleton' },
    }), { id: 'singleton', googleAnalyticsId: null, googleTagManagerId: null, metaPixelId: null, tiktokPixelId: null, linkedinInsightId: null, hotjarId: null, microsoftClarityId: null, googleAnalyticsEnabled: false, googleTagManagerEnabled: false, metaPixelEnabled: false, tiktokPixelEnabled: false, linkedinInsightEnabled: false, hotjarEnabled: false, microsoftClarityEnabled: false, updatedAt: new Date() }),

    safe(() => prisma.themeSettings.upsert({
      where: { id: 'singleton' }, update: {},
      create: { id: 'singleton', mode: 'light', primaryColor: '#f97316', secondaryColor: '#1f2937' },
    }), { id: 'singleton', mode: 'light', primaryColor: '#f97316', secondaryColor: '#1f2937', logoLight: null, logoDark: null, updatedAt: new Date() }),

    safe(() => prisma.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } }), []),
    safe(() => prisma.bankAccount.findMany({ orderBy: { sortOrder: 'asc' } }), []),
    safe(() => prisma.approvalRequest.findMany({ where: { status: 'pending' } }), []),
    safe(() => prisma.rolePermission.findMany(), []),

    safe(() => prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        department: true, active: true, mustChangePassword: true,
        lastLoginAt: true, createdAt: true,
      },
    }), []),

    safe(() => prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }), []),
  ])

  return (
    <ConfiguracoesClient
      storeSettings={storeSettings}
      socialSettings={socialSettings}
      emailSettings={emailSettings}
      seoSettings={seoSettings}
      analyticsSettings={analyticsSettings}
      themeSettings={themeSettings}
      paymentMethods={paymentMethods}
      bankAccounts={bankAccounts}
      approvalRequests={approvalRequests}
      rolePermissions={rolePermissions}
      users={users}
      auditLogs={auditLogs}
    />
  )
}
