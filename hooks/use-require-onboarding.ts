'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useRequireOnboarding() {
  const router = useRouter()

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}')
      if (!data.firstName || !data.region || !data.currentTolerance) {
        router.replace('/onboarding/welcome')
      }
    } catch {
      router.replace('/onboarding/welcome')
    }
  }, [router])
}
