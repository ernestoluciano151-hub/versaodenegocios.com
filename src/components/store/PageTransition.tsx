'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [key, setKey] = useState(pathname)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => {
      setKey(pathname)
      setVisible(true)
    }, 80)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <div
      key={key}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}
    >
      {children}
    </div>
  )
}
