'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, StopCircle } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import planMock from '@/mocks/rehab-plan.json'
import type { RehabPlan } from '@/types'

function getStoredPlan(): RehabPlan {
  try {
    const stored = localStorage.getItem('sb_plan')
    if (stored) return JSON.parse(stored) as RehabPlan
  } catch { /* fall through */ }
  return planMock as RehabPlan
}

const CONFIDENCE_COLORS = {
  high: { bg: 'bg-[#E8F5EE]', text: 'text-sb-success', label: 'High confidence' },
  moderate: { bg: 'bg-[#FEF3CD]', text: 'text-[#B07D00]', label: 'Moderate confidence' },
  low: { bg: 'bg-[#FEF3CD]', text: 'text-[#B07D00]', label: 'Lower confidence' },
}

const DISCLAIMER = 'StrideBack provides structured guidance and educational support for self-managed rehabilitation. It is not a substitute for professional medical diagnosis or treatment.'

export default function PlanPage() {
  const router = useRouter()
  useRequireOnboarding()
  const [plan, setPlan] = useState<RehabPlan>(planMock as RehabPlan)
  const [runningExpanded, setRunningExpanded] = useState(false)
  const [rulesExpanded, setRulesExpanded] = useState(false)
  const [completedDays, setCompletedDays] = useState<number[]>([])
  const confidence = CONFIDENCE_COLORS[plan.aiConfidence]

  useEffect(() => {
    setPlan(getStoredPlan())
    const stored = JSON.parse(localStorage.getItem('sb_completed_days') ?? '[]')
    setCompletedDays(stored)
  }, [])

  return (
    <div className="min-h-screen bg-white pb-44">
      {/* Header */}
      <div className="bg-sb-primary px-6 pt-12 pb-8">
        <div className="w-full max-w-[480px] mx-auto">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Your rehab plan</p>
          <h1 className="text-xl font-bold text-white leading-snug">{plan.phase}</h1>
        </div>
      </div>

      <div className="w-full max-w-[480px] mx-auto px-6">
        {/* Plan goal */}
        <div className="py-6 border-b border-gray-100">
          <p className="text-sm text-[#555] leading-relaxed">{plan.planGoal}</p>
        </div>

        {/* Running allowance */}
        <div className="py-6 border-b border-gray-100">
          <div className={`rounded-xl p-4 ${plan.runningAllowance.allowed ? 'bg-[#E8F5EE]' : 'bg-[#FEF3CD]'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-sb-success shrink-0" />
              <p className="font-semibold text-sm text-sb-primary">Running: allowed this week</p>
            </div>
            <p className="text-sm text-[#555] leading-relaxed mb-3">{plan.runningAllowance.guidance}</p>
            <button
              type="button"
              onClick={() => setRunningExpanded(v => !v)}
              onTouchEnd={(e) => { e.preventDefault(); setRunningExpanded(v => !v) }}
              className="flex items-center gap-1 text-xs font-semibold text-sb-primary-mid"
            >
              {runningExpanded ? 'Hide protocol' : 'View run protocol'}
              {runningExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {runningExpanded && (
              <ul className="mt-3 space-y-2">
                {plan.runningAllowance.protocol.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#555]">
                    <span className="text-sb-primary-mid font-bold shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* This week's sessions */}
        <div className="py-6 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">This week's sessions</p>
          <div className="space-y-3">
            {plan.strengthSessions.map((session, i) => {
              const done = completedDays.includes(i)
              return (
                <div
                  key={session.day}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border ${done ? 'border-sb-success bg-[#E8F5EE]' : 'border-gray-200'}`}
                >
                  <div>
                    <p className={`text-xs font-semibold mb-0.5 ${done ? 'text-sb-success' : 'text-sb-primary-mid'}`}>{session.day}</p>
                    <p className="text-sm font-medium text-[#333]">{session.focus}</p>
                    <p className="text-xs text-[#555]/60 mt-0.5">{done ? 'Completed' : `${session.exercises.length} exercises`}</p>
                  </div>
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-sb-success shrink-0" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push(`/session?day=${i}`)}
                      onTouchEnd={(e) => { e.preventDefault(); router.push(`/session?day=${i}`) }}
                      className="p-2 -mr-1 text-[#555]/40"
                      aria-label={`Open ${session.day}`}
                    >
                      <ChevronDown className="w-5 h-5 -rotate-90" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Week complete banner */}
        {completedDays.length >= plan.strengthSessions.length && (
          <div className="py-6 border-b border-gray-100">
            <div className="bg-[#E8F5EE] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-sb-success shrink-0" />
                <p className="font-semibold text-sm text-sb-primary">Great week — all sessions done!</p>
              </div>
              <p className="text-sm text-[#555] leading-relaxed mb-3">Time to review your progress and adjust your plan for next week.</p>
              <button
                type="button"
                onClick={() => router.push('/review')}
                onTouchEnd={(e) => { e.preventDefault(); router.push('/review') }}
                className="text-xs font-semibold text-sb-primary-mid flex items-center gap-1"
              >
                Start weekly review <ChevronDown className="w-3 h-3 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* Mobility & recovery */}
        <div className="py-6 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Mobility & recovery</p>
          <ul className="space-y-2">
            {plan.mobilityRecovery.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#555] leading-snug">
                <span className="text-sb-primary-mid shrink-0 mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rules */}
        <div className="py-6 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setRulesExpanded(v => !v)}
            onTouchEnd={(e) => { e.preventDefault(); setRulesExpanded(v => !v) }}
            className="w-full flex items-center justify-between mb-4"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50">Progression & safety rules</p>
            {rulesExpanded ? <ChevronUp className="w-4 h-4 text-[#555]/40" /> : <ChevronDown className="w-4 h-4 text-[#555]/40" />}
          </button>
          {rulesExpanded && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-sb-success" />
                  <p className="text-xs font-semibold text-sb-success uppercase tracking-wide">Progress when</p>
                </div>
                <ul className="space-y-1.5">
                  {plan.progressionRules.map((r, i) => (
                    <li key={i} className="text-sm text-[#555] leading-snug pl-6">· {r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StopCircle className="w-4 h-4 text-sb-caution" />
                  <p className="text-xs font-semibold text-sb-stop uppercase tracking-wide">Stop or escalate if</p>
                </div>
                <ul className="space-y-1.5">
                  {plan.stopOrEscalateRules.map((r, i) => (
                    <li key={i} className="text-sm text-[#555] leading-snug pl-6">· {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Education notes */}
        <div className="py-6 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Good to know</p>
          <div className="space-y-3">
            {plan.educationNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-3 bg-sb-primary-light/50 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-sb-caution shrink-0 mt-0.5" />
                <p className="text-sm text-[#555] leading-snug">{note}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="py-6 text-xs text-[#555]/50 leading-relaxed text-center">{DISCLAIMER}</p>
      </div>

      <BottomNav />
    </div>
  )
}
