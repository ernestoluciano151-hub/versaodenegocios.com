import Link from 'next/link'
import { Zap, MapPin, Phone, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">VN Commerce</span>
            </div>
            <p className="text-sm leading-relaxed">
              Especialistas em produtos eletrónicos importados. Qualidade garantida, preços competitivos.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-orange-500 transition-colors text-xs font-bold" aria-label="Facebook">
                fb
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-orange-500 transition-colors text-xs font-bold" aria-label="Instagram">
                ig
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Produtos</h3>
            <ul className="space-y-2 text-sm">
              {['Smartphones', 'Computadores', 'Áudio', 'TV & Vídeo', 'Gaming', 'Acessórios'].map((item) => (
                <li key={item}>
                  <Link href={`/produtos?categoria=${item.toLowerCase()}`} className="hover:text-orange-400 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white font-semibold mb-4">Ajuda</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/conta/pedidos', label: 'Os Meus Pedidos' },
                { href: '/conta', label: 'Minha Conta' },
                { href: '/sobre', label: 'Sobre Nós' },
                { href: '/contacto', label: 'Contacto' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-orange-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-orange-400 flex-shrink-0" />
                <span>Luanda, Angola</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span>+244 923 000 000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span>info@versaodenegocios.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} VN Commerce. Todos os direitos reservados.</p>
          <p>Desenvolvido em Angola 🇦🇴</p>
        </div>
      </div>
    </footer>
  )
}
