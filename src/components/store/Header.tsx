'use client'

import Link from 'next/link'
import { ShoppingCart, Search, Heart, User, Menu, X, Zap } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navLinks = [
  { href: '/produtos', label: 'Produtos' },
  { href: '/produtos?categoria=smartphones', label: 'Smartphones' },
  { href: '/produtos?categoria=computadores', label: 'Computadores' },
  { href: '/produtos?categoria=audio', label: 'Áudio' },
  { href: '/produtos?destaque=true', label: 'Promoções' },
]

export function Header() {
  const { getItemCount } = useCartStore()
  const { openCart, openSearch, mobileMenuOpen, openMobileMenu, closeMobileMenu } = useUIStore()
  const itemCount = getItemCount()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Top bar */}
      <div className="bg-gray-900 text-white text-xs py-1.5 text-center">
        🚚 Entrega ao domicílio em Luanda · Pagamento na Entrega disponível
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">VN Tech</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-orange-500 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={openSearch}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-500 transition-colors"
              aria-label="Pesquisar"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href="/conta/favoritos"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-500 transition-colors hidden sm:block"
              aria-label="Favoritos"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              href="/conta"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-500 transition-colors hidden sm:block"
              aria-label="Minha conta"
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              onClick={openCart}
              className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-500 transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            <button
              onClick={mobileMenuOpen ? closeMobileMenu : openMobileMenu}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-4">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className="text-sm text-gray-700 hover:text-orange-500 font-medium py-1"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-3 flex gap-4">
              <Link href="/conta" onClick={closeMobileMenu} className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4" /> Minha Conta
              </Link>
              <Link href="/conta/favoritos" onClick={closeMobileMenu} className="flex items-center gap-2 text-sm text-gray-700">
                <Heart className="w-4 h-4" /> Favoritos
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
