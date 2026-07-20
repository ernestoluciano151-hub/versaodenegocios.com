import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Mail, Shield, Truck, CreditCard, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sobre Nós | VN Commerce',
  description: 'Conheça a VN Commerce — especialistas em produtos eletrónicos importados em Angola.' }

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center">
              <Image src="/logo.svg" className="w-9 h-9 text-white" alt="VN Commerce" width={24} height={24} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sobre a VN Commerce</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Especialistas em produtos eletrónicos importados, comprometidos em trazer tecnologia de qualidade a preços acessíveis para Angola.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">A Nossa Missão</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A VN Commerce nasceu com o objectivo de democratizar o acesso a produtos eletrónicos de qualidade em Angola. Importamos directamente da China, EUA, Portugal e Brasil, garantindo preços competitivos sem abrir mão da qualidade.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Acreditamos que todos merecem ter acesso à melhor tecnologia. Por isso, trabalhamos diariamente para oferecer um catálogo diversificado, atendimento personalizado e entrega ágil em Luanda.
              </p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-8 border border-orange-100">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-orange-500" />
                <span className="font-semibold text-gray-900">A Nossa Equipa</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Somos uma equipa dedicada de profissionais apaixonados por tecnologia e pelo serviço ao cliente. Estamos aqui para ajudar antes, durante e após a compra.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Os Nossos Valores</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Qualidade Garantida', desc: 'Todos os produtos passam por verificação rigorosa antes de chegar até si.' },
              { icon: Truck, title: 'Entrega Rápida', desc: 'Entregamos ao seu domicílio em Luanda com rapidez e segurança.' },
              { icon: CreditCard, title: 'Pagamento Seguro', desc: 'Pague na entrega ou por Multicaixa Express. Sem surpresas.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pronto para explorar?</h2>
          <p className="text-gray-600 mb-8">Descubra o nosso catálogo ou entre em contacto — estamos aqui para ajudar.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/produtos" className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors">
              Ver Produtos
            </Link>
            <Link href="/contacto" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:border-orange-500 hover:text-orange-500 transition-colors">
              Contactar-nos
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
