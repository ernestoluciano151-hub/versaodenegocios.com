'use client'

import Link from 'next/link'
import { ShoppingCart, Search, Heart, User, Menu, X, Zap } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { useState, useEffect, memo } from 'react'

const navLinks = [
  { href: '/produtos', label: 'Produtos' },
  { href: '/produtos?categoria=smartphones', label: 'Smartphones' },
  { href: '/produtos?categoria=computadores', label: 'Computadores' },
  { href: '/produtos?categoria=audio', label: 'Áudio' },
  { href: '/produtos?destaque=true', label: '🔥 Promoções' },
]

export const Header = memo(function Header() {
  const { getItemCount } = useCartStore()
  const { openCart, openSearch, mobileMenuOpen, openMobileMenu, closeMobileMenu } = useUIStore()

  // Prevent hydration mismatch: only show cart count client-side
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const itemCount = mounted ? getItemCount() : 0

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Promo bar — fixed height to prevent CLS */}
      <div className="bg-gray-900 text-white text-xs py-1.5 text-center h-7 flex items-center justify-center">
        🚚 Entrega ao domicílio em Luanda · Pagamento na Entrega disponível
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="VN Commerce — início">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" aria-hidden />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">VN Commerce</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Navegação principal">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-orange-500 font-medium transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={openSearch}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-500 transition-colors"
              aria-label="Pesquisar produtos"
            >
              <Search className="w-5 h-5" aria-hidden />
            </button>

            <Link
              href="/conta/favoritos"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-500 transition-colors hidden sm:flex"
              aria-label="Lista de favoritos"
            >
              <Heart className="w-5 h-5" aria-hidden />
            </Link>

            <Link
              href="/conta"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-500 transition-colors hidden sm:flex"
              aria-label="A minha conta"
            >
              <User className="w-5 h-5" aria-hidden />
            </Link>

            {/* Cart — reserve space always to prevent CLS */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-500 transition-colors"
              aria-label={`Carrinho${itemCount > 0 ? ` (${itemCount} itens)` : ''}`}
            >
              <ShoppingCart className="w-5 h-5" aria-hidden />
              {/* Always render the badge container with fixed size */}
              <span
                className={`absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold transition-all duration-200 ${itemCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                aria-hidden
              >
                {itemCount > 99 ? '99+' : itemCount || ''}
              </span>
            </button>

            <button
              onClick={mobileMenuOpen ? closeMobileMenu : openMobileMenu}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — animate smoothly */}
      <div
        className={`lg:hidden border-t border-gray-200 bg-white overflow-hidden transition-all duration-200 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        aria-hidden={!mobileMenuOpen}
      >
        <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Menu móvel">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMobileMenu}
              className="text-sm text-gray-700 hover:text-orange-500 font-medium py-2 border-b border-gray-50 last:border-0 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex gap-4">
            <Link href="/conta" onClick={closeMobileMenu} className="flex items-center gap-2 text-sm text-gray-700 hover:text-orange-500 transition-colors">
              <User className="w-4 h-4" aria-hidden /> Minha Conta
            </Link>
            <Link href="/conta/favoritos" onClick={closeMobileMenu} className="flex items-center gap-2 text-sm text-gray-700 hover:text-orange-500 transition-colors">
              <Heart className="w-4 h-4" aria-hidden /> Favoritos
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
})
