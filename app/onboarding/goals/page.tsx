'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, HeartPulse, Shield, Zap, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RunnerGoal } from '@/types'

const GOALS: {
  value: RunnerGoal
  icon: React.ElementType
  title: string
  description: string
  iconColor: string
  iconBg: string
}[] = [
  {
    value: 'rehab',
    icon: HeartPulse,
    title: 'Injury Rehab',
    description: 'I have an injury I need to fix. Build me a structured recovery plan to get back running safely.',
    iconColor: 'text-sb-caution',
    iconBg: 'bg-sb-caution/10',
  },
  {
    value: 'prevention',
    icon: Shield,
    title: 'Injury Prevention',
    description: 'I want to stay healthy and injury-free. Strengthen the areas that keep runners sidelined.',
    iconColor: 'text-sb-success',
    iconBg: 'bg-sb-success/10',
  },
  {
    value: 'optimisation',
    icon: Zap,
    title: 'Performance',
    description: 'I want to run faster and perform better. Build strength, power and running economy.',
    iconColor: 'text-sb-primary-mid',
    iconBg: 'bg-sb-primary-mid/10',
  },
]

function getSaved(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}') } catch { return {} }
}

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<RunnerGoal[]>([])
  const [showPainCheck, setShowPainCheck] = useState(false)

  useEffect(() => {
    const saved = getSaved()
    if (Array.isArray(saved.goals)) setGoals(saved.goals as RunnerGoal[])
  }, [])

  const toggle = (goal: RunnerGoal) => {
    setGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    )
    setShowPainCheck(false)
  }

  const proceed = (selectedGoals: RunnerGoal[]) => {
    localStorage.setItem('sb_onboarding', JSON.stringify({
      ...getSaved(),
      goals: selectedGoals,
    }))
    router.push('/onboarding/profile')
  }

  const handleContinue = () => {
    if (!goals.includes('rehab')) {
      setShowPainCheck(true)
      return
    }
    proceed(goals)
  }

  const handleAddRehab = () => {
    const updated = ['rehab', ...goals] as RunnerGoal[]
    setGoals(updated)
    setShowPainCheck(false)
    localStorage.setItem('sb_onboarding', JSON.stringify({ ...getSaved(), goals: updated }))
    router.push('/onboarding/profile')
  }

  const handleNoPain = () => {
    setShowPainCheck(false)
    proceed(goals)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[480px] mx-auto px-6 pt-12 pb-32">
        <Link
          href="/onboarding/welcome"
          className="mb-6 p-2 -ml-2 inline-flex text-[#555]"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <h2 className="text-2xl font-bold text-sb-primary mt-2 mb-1">
          What do you want to achieve?
        </h2>
        <p className="text-sm mb-8" style={{ color: '#555', opacity: 0.7 }}>
          Choose one or more — your plan will cover all of them.
        </p>

        <div className="space-y-3 mb-6">
          {GOALS.map((goal) => {
            const selected = goals.includes(goal.value)
            const Icon = goal.icon
            return (
              <button
                key={goal.value}
                type="button"
                onClick={() => toggle(goal.value)}
                className={`w-full text-left flex items-start gap-4 px-4 py-4 rounded-2xl border-2 transition-all ${
                  selected
                    ? 'border-sb-primary-mid bg-sb-primary-mid/5'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    selected ? 'bg-sb-primary-mid' : goal.iconBg
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${selected ? 'text-white' : goal.iconColor}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-base font-semibold leading-snug ${
                      selected ? 'text-sb-primary' : 'text-[#333]'
                    }`}
                  >
                    {goal.title}
                  </p>
                  <p
                    className={`text-sm mt-1 leading-relaxed ${
                      selected ? 'text-[#333]' : 'text-[#555]/60'
                    }`}
                  >
                    {goal.description}
                  </p>
                </div>
                <div
                  className={`mt-0.5 shrink-0 transition-colors ${
                    selected ? 'text-sb-primary-mid' : 'text-gray-200'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </button>
            )
          })}
        </div>

        {goals.includes('rehab') && goals.length > 1 && (
          <div className="flex items-start gap-3 bg-sb-primary-light rounded-xl px-4 py-3">
            <span className="text-base mt-0.5">💡</span>
            <p className="text-xs text-sb-primary leading-relaxed">
              Rehab comes first. Prevention and performance work will be woven in as your recovery progresses.
            </p>
          </div>
        )}

        {showPainCheck && (
          <div className="border-2 border-sb-caution/40 bg-sb-caution/5 rounded-2xl px-4 py-5">
            <p className="text-sm font-semibold text-[#333] mb-1">Do you have any current pain or injury affecting your running?</p>
            <p className="text-xs text-[#555]/60 mb-4 leading-relaxed">Even something mild — tightness, soreness, or a niggle that keeps coming back.</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleAddRehab}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-sb-caution bg-white text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-[#333]">Yes — add Injury Rehab to my plan</p>
                  <p className="text-xs text-[#555]/60 mt-0.5">We&apos;ll ask a few questions about it</p>
                </div>
                <HeartPulse className="w-5 h-5 text-sb-caution shrink-0 ml-3" />
              </button>
              <button
                type="button"
                onClick={handleNoPain}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#555] text-left"
              >
                No — I&apos;m currently pain-free
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4">
        <div className="w-full max-w-[480px] mx-auto">
          <Button
            className="w-full h-12 text-base rounded-xl"
            onClick={handleContinue}
            disabled={goals.length === 0}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
