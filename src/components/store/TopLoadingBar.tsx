'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function TopLoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const last = useRef(pathname + searchParams.toString())

  useEffect(() => {
    const current = pathname + searchParams.toString()
    if (current === last.current) return
    last.current = current

    // Start loading bar
    setVisible(true)
    setProgress(20)

    const t1 = setTimeout(() => setProgress(60), 100)
    const t2 = setTimeout(() => setProgress(85), 300)
    const t3 = setTimeout(() => {
      setProgress(100)
      timerRef.current = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    }, 600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-orange-200"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <div
        className="h-full bg-orange-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
