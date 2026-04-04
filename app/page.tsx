'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    try {
      const onboarding = JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}')
      const plan = localStorage.getItem('sb_plan')
      const goals: string[] = Array.isArray(onboarding.goals) ? onboarding.goals : []
      const hasRehab = goals.includes('rehab')
      const hasOnboarding = onboarding.firstName && (!hasRehab || (onboarding.region && onboarding.currentTolerance))
      if (hasOnboarding && plan) {
        router.replace('/plan')
      } else {
        router.replace('/onboarding/welcome')
      }
    } catch {
      router.replace('/onboarding/welcome')
    }
  }, [router])

  return <div className="min-h-screen bg-white" />
}
