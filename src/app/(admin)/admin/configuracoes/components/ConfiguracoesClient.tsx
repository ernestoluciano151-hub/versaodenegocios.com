'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TopBar } from '@/components/admin/TopBar'
import { GeneralTab } from './GeneralTab'
import { UsersTab } from './UsersTab'
import { PaymentsTab } from './PaymentsTab'
import { BankAccountsTab } from './BankAccountsTab'
import { EmailTab } from './EmailTab'
import { SeoTab } from './SeoTab'
import { AnalyticsTab } from './AnalyticsTab'
import { ThemeTab } from './ThemeTab'
import { SocialTab } from './SocialTab'
import { SecurityTab } from './SecurityTab'
import { ApprovalsTab } from './ApprovalsTab'
import { PermissionsTab } from './PermissionsTab'

interface Props {
  storeSettings: any
  socialSettings: any
  emailSettings: any
  seoSettings: any
  analyticsSettings: any
  themeSettings: any
  paymentMethods: any[]
  bankAccounts: any[]
  approvalRequests: any[]
  rolePermissions: any[]
  users: any[]
  auditLogs: any[]
}

export function ConfiguracoesClient({
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
}: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Configurações" />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <Tabs defaultValue="geral" className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 overflow-x-auto">
            <TabsList className="h-auto bg-transparent p-0 gap-0 rounded-none w-max">
              {[
                ['geral', 'Geral'],
                ['utilizadores', 'Utilizadores'],
                ['pagamentos', 'Pagamentos'],
                ['banco', 'Banco'],
                ['email', 'Email'],
                ['seo', 'SEO'],
                ['analytics', 'Analytics'],
                ['tema', 'Tema'],
                ['redes-sociais', 'Redes Sociais'],
                ['seguranca', 'Segurança'],
                ['aprovacoes', 'Aprovações'],
                ['permissoes', 'Permissões'],
              ].map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-orange-600 data-[state=active]:shadow-none text-gray-500 hover:text-gray-700 px-4 py-3 text-sm font-medium whitespace-nowrap"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="geral" className="mt-0">
              <GeneralTab data={storeSettings} />
            </TabsContent>
            <TabsContent value="utilizadores" className="mt-0">
              <UsersTab users={users} />
            </TabsContent>
            <TabsContent value="pagamentos" className="mt-0">
              <PaymentsTab paymentMethods={paymentMethods} />
            </TabsContent>
            <TabsContent value="banco" className="mt-0">
              <BankAccountsTab bankAccounts={bankAccounts} />
            </TabsContent>
            <TabsContent value="email" className="mt-0">
              <EmailTab data={emailSettings} />
            </TabsContent>
            <TabsContent value="seo" className="mt-0">
              <SeoTab data={seoSettings} />
            </TabsContent>
            <TabsContent value="analytics" className="mt-0">
              <AnalyticsTab data={analyticsSettings} />
            </TabsContent>
            <TabsContent value="tema" className="mt-0">
              <ThemeTab data={themeSettings} />
            </TabsContent>
            <TabsContent value="redes-sociais" className="mt-0">
              <SocialTab data={socialSettings} />
            </TabsContent>
            <TabsContent value="seguranca" className="mt-0">
              <SecurityTab auditLogs={auditLogs} />
            </TabsContent>
            <TabsContent value="aprovacoes" className="mt-0">
              <ApprovalsTab approvalRequests={approvalRequests} />
            </TabsContent>
            <TabsContent value="permissoes" className="mt-0">
              <PermissionsTab rolePermissions={rolePermissions} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
