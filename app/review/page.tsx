'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { CheckCircle2, AlertTriangle, ArrowRight, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/bottom-nav'
import type { WeeklyReview } from '@/types'
// TODO: Replace with live Claude API call POST /api/weekly-review
import progressData from '@/mocks/weekly-review-progress.json'
import holdData from '@/mocks/weekly-review-hold.json'

type ReviewDecision = 'progress' | 'hold'

const MOCK_BY_STATE: Record<ReviewDecision, WeeklyReview> = {
  progress: progressData as WeeklyReview,
  hold: holdData as WeeklyReview,
}

const DECISION_CONFIG = {
  progress: {
    label: 'Progress to next phase',
    bg: 'bg-sb-success',
    lightBg: 'bg-[#E8F5EE]',
    text: 'text-sb-success',
    border: 'border-[#A8D5BC]',
  },
  hold: {
    label: 'Hold at current phase',
    bg: 'bg-sb-caution',
    lightBg: 'bg-[#FEF3CD]',
    text: 'text-[#B07D00]',
    border: 'border-[#F5D98B]',
  },
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-sb-success',
  moderate: 'text-[#B07D00]',
  low: 'text-[#B07D00]',
}

// DEV ONLY
function DevToggle({ current, onChange }: { current: ReviewDecision; onChange: (s: ReviewDecision) => void }) {
  if (process.env.NODE_ENV !== 'development') return null
  return (
    <div className="fixed top-3 right-3 z-50 flex gap-1 rounded-lg p-1 text-xs font-mono bg-black/40">
      {(['progress', 'hold'] as ReviewDecision[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onTouchEnd={(e) => { e.preventDefault(); onChange(s) }}
          style={{
            backgroundColor: current === s ? (s === 'progress' ? '#1F7A4D' : '#F5A623') : undefined,
            color: current === s ? '#fff' : (s === 'progress' ? '#1F7A4D' : '#F5A623'),
          }}
          className={`px-2 py-1 rounded font-bold border border-current ${current === s ? '' : 'opacity-60'}`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

export default function ReviewPage() {
  useRequireOnboarding()
  const router = useRouter()
  const [devState, setDevState] = useState<ReviewDecision>('progress')
  const review = MOCK_BY_STATE[devState]
  const config = DECISION_CONFIG[devState]
  const isProgress = devState === 'progress'

  return (
    <div className="min-h-screen bg-white pb-32">
      <DevToggle current={devState} onChange={setDevState} />

      {/* Header */}
      <div className="bg-sb-primary px-6 pt-12 pb-8">
        <div className="w-full max-w-[480px] mx-auto">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Weekly review</p>
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white ${config.bg}`}>
            {isProgress
              ? <CheckCircle2 className="w-4 h-4" />
              : <AlertTriangle className="w-4 h-4" />
            }
            {config.label}
          </span>
        </div>
      </div>

      <div className="w-full max-w-[480px] mx-auto px-6 pt-6">

        {/* Summary */}
        <div className={`rounded-xl p-4 mb-6 ${config.lightBg} border ${config.border}`}>
          <div className="flex items-start gap-2 mb-2">
            <Brain className={`w-4 h-4 shrink-0 mt-0.5 ${config.text}`} />
            <p className={`text-xs font-semibold uppercase tracking-wide ${config.text}`}>
              AI summary · <span className={CONFIDENCE_COLORS[review.confidence] ?? ''}>
                {review.confidence} confidence
              </span>
            </p>
          </div>
          <p className="text-sm text-[#333] leading-relaxed">{review.summary}</p>
        </div>

        {/* What improved */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">What improved</p>
          <ul className="space-y-2">
            {review.whatImproved.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#555] leading-snug">
                <CheckCircle2 className="w-4 h-4 text-sb-success shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What needs attention */}
        {review.whatNeedsAttention.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Needs attention</p>
            <ul className="space-y-2">
              {review.whatNeedsAttention.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[#555] leading-snug">
                  <AlertTriangle className="w-4 h-4 text-sb-caution shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next week changes */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Next week</p>
          <ul className="space-y-2">
            {review.nextWeekChanges.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#555] leading-snug">
                <ArrowRight className="w-4 h-4 text-sb-primary-mid shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Reasoning */}
        <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-2">Reasoning</p>
          <p className="text-sm text-[#555] leading-relaxed">{review.reasoning}</p>
        </div>

      </div>

      {/* Fixed CTA — sits above bottom nav */}
      <div className="fixed bottom-16 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4">
        <div className="w-full max-w-[480px] mx-auto">
          <Button
            className="w-full h-12 text-base rounded-xl"
            onClick={() => { localStorage.removeItem('sb_completed_days'); router.push('/plan') }}
            onTouchEnd={(e: React.TouchEvent) => { e.preventDefault(); localStorage.removeItem('sb_completed_days'); router.push('/plan') }}
          >
            Got it — continue my plan
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
