'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useRequireOnboarding() {
  const router = useRouter()

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}')
      const goals: string[] = Array.isArray(data.goals) ? data.goals : []
      const hasRehab = goals.includes('rehab')
      const missingBase = !data.firstName
      const missingInjury = hasRehab && (!data.region || !data.currentTolerance)
      if (missingBase || missingInjury) {
        router.replace('/onboarding/welcome')
      }
    } catch {
      router.replace('/onboarding/welcome')
    }
  }, [router])
}
