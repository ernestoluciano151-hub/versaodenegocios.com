import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SECRET = 'b1c14b41a049add9601dae381a919b8ee797e496eada774d2fbfaf0ef2164145'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (token !== SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const results: string[] = []

  const run = async (label: string, sql: string) => {
    try {
      await prisma.$executeRawUnsafe(sql)
      results.push(`✔ ${label}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      // Ignore "already exists" errors
      if (msg.includes('already exists') || msg.includes('duplicate column')) {
        results.push(`~ ${label} (already exists)`)
      } else {
        results.push(`✗ ${label}: ${msg}`)
      }
    }
  }

  // ── New UserRole enum values ──────────────────────────────────────────────
  await run('UserRole FINANCIAL_MANAGER', `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FINANCIAL_MANAGER'`)
  await run('UserRole SALES_MANAGER', `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SALES_MANAGER'`)
  await run('UserRole MARKETING', `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MARKETING'`)
  await run('UserRole WAREHOUSE', `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'WAREHOUSE'`)
  await run('UserRole OPERATOR', `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OPERATOR'`)

  // ── New PaymentMethodStatus enum value ───────────────────────────────────
  await run('PaymentMethodStatus maintenance', `ALTER TYPE "PaymentMethodStatus" ADD VALUE IF NOT EXISTS 'maintenance'`)

  // ── User new columns ──────────────────────────────────────────────────────
  await run('users.department', `ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT`)
  await run('users.mustChangePassword', `ALTER TABLE users ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false`)
  await run('users.lastLoginAt', `ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3)`)
  await run('users.lastLoginIp', `ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT`)

  // ── PaymentMethod new columns ─────────────────────────────────────────────
  await run('payment_methods.showInStore', `ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS "showInStore" BOOLEAN NOT NULL DEFAULT true`)
  await run('payment_methods.sortOrder', `ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0`)
  await run('payment_methods.description', `ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS description TEXT`)

  // ── StoreSettings ─────────────────────────────────────────────────────────
  await run('store_settings table', `
    CREATE TABLE IF NOT EXISTS store_settings (
      id TEXT NOT NULL PRIMARY KEY,
      "companyName" TEXT NOT NULL DEFAULT 'VN Commerce',
      logo TEXT,
      "logoDark" TEXT,
      "logoWhite" TEXT,
      favicon TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      website TEXT,
      address TEXT,
      city TEXT,
      province TEXT,
      country TEXT NOT NULL DEFAULT 'Angola',
      nif TEXT,
      currency TEXT NOT NULL DEFAULT 'AOA',
      "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
      "timeFormat" TEXT NOT NULL DEFAULT 'HH:mm',
      timezone TEXT NOT NULL DEFAULT 'Africa/Luanda',
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `)

  // ── SocialSettings ────────────────────────────────────────────────────────
  await run('social_settings table', `
    CREATE TABLE IF NOT EXISTS social_settings (
      id TEXT NOT NULL PRIMARY KEY,
      facebook TEXT,
      instagram TEXT,
      linkedin TEXT,
      tiktok TEXT,
      youtube TEXT,
      twitter TEXT,
      whatsapp TEXT,
      telegram TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `)

  // ── EmailSettings ─────────────────────────────────────────────────────────
  await run('email_settings table', `
    CREATE TABLE IF NOT EXISTS email_settings (
      id TEXT NOT NULL PRIMARY KEY,
      provider TEXT NOT NULL DEFAULT 'resend',
      "apiKey" TEXT,
      "fromEmail" TEXT,
      "fromName" TEXT,
      "supportEmail" TEXT,
      "financeEmail" TEXT,
      "salesEmail" TEXT,
      "defaultTemplate" TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `)

  // ── SeoSettings ───────────────────────────────────────────────────────────
  await run('seo_settings table', `
    CREATE TABLE IF NOT EXISTS seo_settings (
      id TEXT NOT NULL PRIMARY KEY,
      "siteTitle" TEXT,
      "siteDescription" TEXT,
      keywords TEXT,
      "googleVerification" TEXT,
      "facebookMeta" TEXT,
      "twitterMeta" TEXT,
      robots TEXT NOT NULL DEFAULT 'index, follow',
      "ogImage" TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `)

  // ── AnalyticsSettings ─────────────────────────────────────────────────────
  await run('analytics_settings table', `
    CREATE TABLE IF NOT EXISTS analytics_settings (
      id TEXT NOT NULL PRIMARY KEY,
      "googleAnalyticsId" TEXT,
      "googleTagManagerId" TEXT,
      "metaPixelId" TEXT,
      "tiktokPixelId" TEXT,
      "linkedinInsightId" TEXT,
      "hotjarId" TEXT,
      "microsoftClarityId" TEXT,
      "googleAnalyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
      "googleTagManagerEnabled" BOOLEAN NOT NULL DEFAULT false,
      "metaPixelEnabled" BOOLEAN NOT NULL DEFAULT false,
      "tiktokPixelEnabled" BOOLEAN NOT NULL DEFAULT false,
      "linkedinInsightEnabled" BOOLEAN NOT NULL DEFAULT false,
      "hotjarEnabled" BOOLEAN NOT NULL DEFAULT false,
      "microsoftClarityEnabled" BOOLEAN NOT NULL DEFAULT false,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `)

  // ── ThemeSettings ─────────────────────────────────────────────────────────
  await run('theme_settings table', `
    CREATE TABLE IF NOT EXISTS theme_settings (
      id TEXT NOT NULL PRIMARY KEY,
      mode TEXT NOT NULL DEFAULT 'light',
      "primaryColor" TEXT NOT NULL DEFAULT '#f97316',
      "secondaryColor" TEXT NOT NULL DEFAULT '#1f2937',
      "logoLight" TEXT,
      "logoDark" TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `)

  // ── BankAccount ───────────────────────────────────────────────────────────
  await run('bank_accounts table', `
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT NOT NULL PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'transfer',
      "bankName" TEXT NOT NULL,
      "accountHolder" TEXT NOT NULL,
      iban TEXT,
      nib TEXT,
      "accountNumber" TEXT,
      swift TEXT,
      currency TEXT NOT NULL DEFAULT 'AOA',
      country TEXT NOT NULL DEFAULT 'Angola',
      active BOOLEAN NOT NULL DEFAULT true,
      "qrCode" TEXT,
      "logoUrl" TEXT,
      notes TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `)

  // ── ApprovalRequest ───────────────────────────────────────────────────────
  await run('approval_requests table', `
    CREATE TABLE IF NOT EXISTS approval_requests (
      id TEXT NOT NULL PRIMARY KEY,
      type TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetLabel" TEXT,
      "requestedBy" TEXT NOT NULL,
      "requestedByName" TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      "approvedBy" TEXT,
      "approvedByName" TEXT,
      comment TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `)
  await run('approval_requests status index', `CREATE INDEX IF NOT EXISTS "approval_requests_status_idx" ON approval_requests(status)`)

  // ── RolePermission ────────────────────────────────────────────────────────
  await run('role_permissions table', `
    CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT NOT NULL PRIMARY KEY,
      role "UserRole" NOT NULL,
      permissions JSONB NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
      CONSTRAINT "role_permissions_role_key" UNIQUE (role)
    )
  `)

  return NextResponse.json({ ok: true, results })
}
