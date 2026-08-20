import Link from 'next/link'
import { PackageSearch, Globe2, Camera, MessageCircle, ArrowRight } from 'lucide-react'

// Destaque do serviço de Encomendas Personalizadas — o diferencial da loja
// (o cliente pede um produto que não está no catálogo, com foto/link de
// referência, e a equipa importa da China, EUA, Portugal ou Brasil). Antes
// isto só existia escondido dentro da Área do Cliente, sem nenhuma menção
// na homepage — quem abria o site não tinha forma de saber que este
// serviço existia.
const FEATURES = [
  { icon: Globe2, text: 'Importamos da China, EUA, Portugal e Brasil' },
  { icon: Camera, text: 'Anexe fotos e links do produto que pretende' },
  { icon: MessageCircle, text: 'Receba orçamento e acompanhe em tempo real' },
]

export function CustomOrderPromo() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-12 relative z-10">
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-orange-950 rounded-2xl shadow-xl border border-orange-500/20 p-6 md:p-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-3 py-1 text-xs font-semibold text-orange-400 mb-4">
              <PackageSearch className="w-3.5 h-3.5" />
              O NOSSO DIFERENCIAL
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Não encontrou o que procura? Encomende connosco!
            </h2>
            <p className="text-gray-300 mb-6 max-w-xl leading-relaxed">
              Diga-nos que produto quer, envie uma foto ou link de referência, e nós
              importamos por si — com orçamento personalizado e acompanhamento do
              pedido do início ao fim.
            </p>
            <ul className="grid sm:grid-cols-3 gap-3 mb-7">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2 text-sm text-gray-300">
                  <Icon className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <Link href="/conta/encomendas-personalizadas">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                Solicitar Encomenda Personalizada <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
