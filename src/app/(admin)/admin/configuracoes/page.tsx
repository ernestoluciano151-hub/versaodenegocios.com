export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { ConfiguracoesClient } from './components/ConfiguracoesClient'

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
    prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton',
        companyName: 'VN Commerce',
        country: 'Angola',
        currency: 'AOA',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        timezone: 'Africa/Luanda',
      },
    }),
    prisma.socialSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    }),
    prisma.emailSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton', provider: 'resend' },
    }),
    prisma.seoSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton', robots: 'index, follow' },
    }),
    prisma.analyticsSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    }),
    prisma.themeSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton',
        mode: 'light',
        primaryColor: '#f97316',
        secondaryColor: '#1f2937',
      },
    }),
    prisma.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.bankAccount.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.approvalRequest.findMany({ where: { status: 'pending' } }),
    prisma.rolePermission.findMany(),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        active: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
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
