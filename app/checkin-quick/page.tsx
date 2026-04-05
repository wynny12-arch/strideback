'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/bottom-nav'

const EFFORT_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Very easy', color: '#1F7A4D' },
  2: { label: 'Easy', color: '#1F7A4D' },
  3: { label: 'Moderate', color: '#B07D00' },
  4: { label: 'Hard', color: '#C0392B' },
  5: { label: 'Very hard', color: '#C0392B' },
}

export default function QuickCheckInPage() {
  return (
    <Suspense>
      <QuickCheckInContent />
    </Suspense>
  )
}

function QuickCheckInContent() {
  useRequireOnboarding()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionType = searchParams.get('type') ?? 'exercises'

  const [effort, setEffort] = useState(3)
  const [notes, setNotes] = useState('')

  const effortInfo = EFFORT_LABELS[effort]

  const handleSubmit = () => {
    const payload = {
      sessionType,
      effort,
      effortLabel: effortInfo.label,
      notes: notes.trim() || null,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem('sb_just_completed_session', JSON.stringify(payload))
    // Also save to checkin history so plan page can detect done-today
    try {
      const history = JSON.parse(localStorage.getItem('sb_checkin_history') ?? '[]')
      history.push({ ...payload, type: 'quick', createdAt: new Date().toISOString() })
      localStorage.setItem('sb_checkin_history', JSON.stringify(history))
    } catch { /* ignore */ }
    router.push('/coach?from=session')
  }

  const typeLabel = sessionType === 'prevention' ? 'injury prevention'
    : sessionType === 'optimisation' ? 'performance'
    : sessionType === 'rehab' ? 'rehab'
    : 'today\'s'

  return (
    <div className="min-h-screen bg-white pb-44">
      <div className="bg-sb-primary px-6 pt-12 pb-6">
        <div className="w-full max-w-[480px] mx-auto">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Session complete</p>
          <h1 className="text-xl font-bold text-white">Nice work 💪</h1>
          <p className="text-white/60 text-sm mt-1">Log how your {typeLabel} exercises felt.</p>
        </div>
      </div>

      <div className="w-full max-w-[480px] mx-auto px-6 pt-8">

        {/* Effort slider */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50">How hard was it?</p>
            <span className="text-sm font-bold" style={{ color: effortInfo.color }}>{effortInfo.label}</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={effort}
            onChange={(e) => setEffort(Number(e.target.value))}
            className="w-full accent-sb-primary"
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-[#555]/40">Very easy</span>
            <span className="text-xs text-[#555]/40">Very hard</span>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">
            Anything to add? <span className="normal-case font-normal text-[#555]/40">(optional)</span>
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any pain, tightness or wins to note?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#333] leading-relaxed resize-none focus:outline-none focus:border-sb-primary-mid"
          />
        </div>

      </div>

      <BottomNav />

      <div className="fixed bottom-16 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4">
        <div className="w-full max-w-[480px] mx-auto">
          <Button className="w-full h-12 text-base rounded-xl" onClick={handleSubmit}>
            Send to coach
          </Button>
        </div>
      </div>
    </div>
  )
}
