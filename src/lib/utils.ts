import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = 'AOA') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatDateShort(date: Date | string) {
  return new Intl.DateTimeFormat('pt-AO', { dateStyle: 'short' }).format(new Date(date))
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function truncate(text: string, length: number) {
  return text.length > length ? text.slice(0, length) + '...' : text
}

export function generateSKU(brand: string, name: string) {
  const b = brand.slice(0, 3).toUpperCase()
  const n = name.slice(0, 3).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${b}-${n}-${rand}`
}

export function calculateDiscount(price: number, salePrice: number) {
  return Math.round(((price - salePrice) / price) * 100)
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
