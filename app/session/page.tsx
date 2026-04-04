'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { ChevronDown, ChevronUp, AlertTriangle, Footprints, Flame } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { ExerciseGif } from '@/components/exercise-gif'
import planMock from '@/mocks/rehab-plan.json'
import type { RehabPlan } from '@/types'

function getStoredPlan(): RehabPlan {
  try {
    const stored = localStorage.getItem('sb_plan')
    if (stored) return JSON.parse(stored) as RehabPlan
  } catch { /* fall through */ }
  return planMock as RehabPlan
}

function ExerciseCard({ exercise, expanded, onToggle }: { exercise: RehabPlan['strengthSessions'][0]['exercises'][0]; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="w-full flex items-center justify-between px-4 py-4 bg-white">
        <div className="flex-1 pr-3">
          <p className="text-sm font-semibold text-[#333] leading-snug">{exercise.name}</p>
          <p className="text-xs text-sb-primary-mid mt-1 font-medium">{exercise.sets} sets × {exercise.reps}</p>
        </div>
        <button
          type="button"
          style={{ touchAction: 'manipulation' }}
          onClick={onToggle}
          className="p-1.5 -mr-1 shrink-0 text-[#555]/40"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-white border-t border-gray-100">
          <div className="pt-3">
            <ExerciseGif name={exercise.name} show={expanded} />
          </div>
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#555]/50 uppercase tracking-wide mb-2">How to do it</p>
              <ol className="space-y-1.5">
                {exercise.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#555] leading-snug">
                    <span className="text-sb-primary-mid font-bold shrink-0 w-4">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-[#555]/50 uppercase tracking-wide mb-1">Tempo</p>
            <p className="text-sm text-[#555] leading-snug">{exercise.tempo}</p>
          </div>
          <div className="bg-[#FEF3CD] rounded-lg px-3 py-2.5 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-sb-caution shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[#B07D00] mb-0.5">Pain rule</p>
              <p className="text-sm text-[#555] leading-snug">{exercise.painRule}</p>
            </div>
          </div>
          <div className="bg-sb-primary-light/50 rounded-lg px-3 py-2.5">
            <p className="text-xs font-semibold text-sb-primary-mid mb-0.5">Why this exercise?</p>
            <p className="text-sm text-[#555] leading-snug">{exercise.reason}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SessionPage() {
  return (
    <Suspense>
      <SessionContent />
    </Suspense>
  )
}

function SessionContent() {
  useRequireOnboarding()
  const searchParams = useSearchParams()
  const dayIndex = Number(searchParams.get('day') ?? 0)
  const [plan, setPlan] = useState<RehabPlan>(planMock as RehabPlan)
  useEffect(() => { setPlan(getStoredPlan()) }, [])
  const session = plan.strengthSessions[dayIndex] ?? plan.strengthSessions[0]
  const totalSessions = plan.strengthSessions.length
  const [showRunning, setShowRunning] = useState(false)
  const [openCard, setOpenCard] = useState<number | null>(null)
  const [anyOpened, setAnyOpened] = useState(false)

  return (
    <div className="min-h-screen bg-white pb-44">
      {/* Header */}
      <div className="bg-sb-primary px-6 pt-12 pb-6">
        <div className="w-full max-w-[480px] mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">
              {session.day} of {totalSessions}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white leading-snug">{session.focus}</h1>
        </div>
      </div>

      <div className="w-full max-w-[480px] mx-auto px-6 pt-6">

        {/* Warm-up */}
        {session.warmUp && session.warmUp.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-sb-caution" />
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50">Warm-up</p>
            </div>
            <div className="bg-sb-primary-light/60 rounded-xl px-4 py-3 space-y-2">
              {session.warmUp.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-[#555] leading-snug">
                  <span className="text-sb-primary-mid font-bold shrink-0 w-4">{i + 1}.</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exercises */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Exercises</p>
          <div className="space-y-3">
            {session.exercises.map((exercise, i) => (
              <ExerciseCard
                key={i}
                exercise={exercise}
                expanded={openCard === i}
                onToggle={() => { setAnyOpened(true); setOpenCard(openCard === i ? null : i) }}
              />
            ))}
          </div>
        </div>

        {/* Running */}
        {plan.runningAllowance.allowed && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Footprints className="w-4 h-4 text-sb-success" />
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50">Running</p>
            </div>
            <div className="rounded-xl bg-[#E8F5EE] p-4">
              <p className="text-sm text-[#555] mb-3 leading-relaxed">{plan.runningAllowance.guidance}</p>
              <button
                type="button"
                onClick={() => setShowRunning(v => !v)}
                onTouchEnd={(e) => { e.preventDefault(); setShowRunning(v => !v) }}
                className="flex items-center gap-1 text-xs font-semibold text-sb-success"
              >
                {showRunning ? 'Hide protocol' : 'View run protocol'}
                {showRunning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showRunning && (
                <ul className="mt-3 space-y-2">
                  {plan.runningAllowance.protocol.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#555]">
                      <span className="text-sb-success font-bold shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Cool down */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Cool down</p>
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
            {['5 minutes easy walking', 'Gentle stretching of the worked area — hold each stretch 30 seconds', 'Note any pain or stiffness to report in your check-in'].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-[#555] leading-snug">
                <span className="text-sb-primary-mid font-bold shrink-0 w-4">{i + 1}.</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mb-6 text-xs text-[#555]/50 leading-relaxed text-center">StrideBack provides structured guidance and educational support for self-managed rehabilitation. It is not a substitute for professional medical diagnosis or treatment.</p>

      </div>

      {/* Fixed CTA — sits above bottom nav, shown only after engaging with session */}
      {anyOpened && (
        <div className="fixed bottom-16 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4">
          <div className="w-full max-w-[480px] mx-auto">
            <Link
              href={`/checkin?day=${dayIndex}`}
              className="w-full h-12 flex items-center justify-center rounded-xl bg-sb-primary text-white text-base font-medium"
            >
              All exercises complete — check in
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
