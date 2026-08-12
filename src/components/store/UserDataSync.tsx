'use client'

import { useEffect } from 'react'

interface Profile {
  name?: string | null
  email?: string | null
  phone?: string | null
}

/**
 * Correspondência Avançada (Advanced Matching) do Meta Pixel.
 *
 * IMPORTANTE: isto tem de ser feito num componente cliente, nunca dentro do
 * `fbq('init', ...)` renderizado no servidor (TrackingScripts.tsx) — essa
 * página tem `revalidate = 60`, ou seja, fica em cache partilhado entre
 * visitantes. Se os dados de um cliente autenticado fossem embutidos nesse
 * HTML, podiam ser servidos a outro visitante diferente dentro da janela
 * de cache. `fbq('set', 'userData', ...)` é seguro porque corre sempre no
 * browser do próprio utilizador, depois do pixel já estar carregado.
 */
export function UserDataSync() {
  useEffect(() => {
    let cancelled = false

    function applyUserData(profile: Profile) {
      if (cancelled || typeof window === 'undefined' || !window.fbq) return

      const email = profile.email?.trim().toLowerCase() || undefined
      const phone = profile.phone?.replace(/\D/g, '') || undefined
      const [firstName, ...rest] = (profile.name ?? '').trim().split(/\s+/).filter(Boolean)
      const fn = firstName?.toLowerCase() || undefined
      const ln = rest.length ? rest.join(' ').toLowerCase() : undefined

      const userData: Record<string, string> = {}
      if (email) userData.em = email
      if (phone) userData.ph = phone
      if (fn) userData.fn = fn
      if (ln) userData.ln = ln
      userData.ct = 'luanda'
      userData.country = 'ao'

      // Nunca enviar strings vazias — só definimos os campos que existem.
      if (Object.keys(userData).length > 2 /* mais do que só ct/country */) {
        window.fbq('set', 'userData', userData)
      }
    }

    // O script do pixel carrega com strategy="afterInteractive" — pode ainda
    // não estar pronto no primeiro tick. Tenta algumas vezes antes de desistir.
    async function run() {
      let attempts = 0
      while (!cancelled && typeof window !== 'undefined' && !window.fbq && attempts < 10) {
        await new Promise((r) => setTimeout(r, 300))
        attempts++
      }
      if (cancelled) return

      try {
        const res = await fetch('/api/conta/profile')
        if (!res.ok) return
        const profile = await res.json()
        applyUserData(profile)
      } catch {
        // sem sessão ou erro de rede — não é crítico, apenas sem correspondência avançada
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}
