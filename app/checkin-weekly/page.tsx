'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/bottom-nav'
import type { RunnerTier } from '@/types'

function getStoredPlan(): { runnerTier?: RunnerTier } {
  try {
    const stored = localStorage.getItem('sb_plan')
    if (stored) return JSON.parse(stored)
  } catch { /* fall through */ }
  return {}
}

function tierLevel(tier: RunnerTier | undefined): number {
  const map: Record<RunnerTier, number> = { novice: 1, intermediate: 2, advanced: 3, semi_elite: 4 }
  return tier ? map[tier] : 1
}

const RUN_FEELING_OPTIONS = [
  { value: 1, label: 'Easy', sub: 'Felt effortless' },
  { value: 2, label: 'Good', sub: 'Solid and comfortable' },
  { value: 3, label: 'Manageable', sub: 'A bit tough' },
  { value: 4, label: 'Tough', sub: 'Harder than expected' },
]

const SUPP_WORK_OPTIONS = [
  { value: 'all', label: 'All of it', sub: 'Completed every session' },
  { value: 'most', label: 'Most', sub: 'Missed one session' },
  { value: 'some', label: 'Some', sub: 'Did a few exercises' },
  { value: 'none', label: 'None', sub: 'Skipped this week' },
]

const SLEEP_OPTIONS = [
  { value: 1, label: 'Poor', sub: '< 5 hrs' },
  { value: 2, label: 'Fair', sub: '5–6 hrs' },
  { value: 3, label: 'Good', sub: '7–8 hrs' },
  { value: 4, label: 'Great', sub: '8+ hrs' },
]

const ENERGY_OPTIONS = [
  { value: 1, label: 'Drained', sub: 'Very low' },
  { value: 2, label: 'Low', sub: 'Below normal' },
  { value: 3, label: 'Normal', sub: 'OK' },
  { value: 4, label: 'High', sub: 'Energised' },
]

function ButtonGrid<T extends string | number>({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: { value: T; label: string; sub?: string }[]
  value: T | null
  onChange: (v: T) => void
  cols?: 2 | 4
}) {
  return (
    <div className={`grid gap-2 ${cols === 4 ? 'grid-cols-4' : 'grid-cols-2'}`}>
      {options.map(({ value: v, label, sub }) => {
        const selected = value === v
        return (
          <button
            key={String(v)}
            type="button"
            style={{ touchAction: 'manipulation' }}
            onClick={() => onChange(v)}
            className={`flex flex-col items-start px-3 py-3 rounded-xl border text-left transition-colors ${
              selected ? 'border-sb-primary-mid bg-sb-primary-mid' : 'border-gray-200 bg-white'
            }`}
          >
            <p className={`text-sm font-semibold ${selected ? 'text-white' : 'text-[#333]'}`}>{label}</p>
            {sub && <p className={`text-xs ${selected ? 'text-white/70' : 'text-[#555]/60'}`}>{sub}</p>}
          </button>
        )
      })}
    </div>
  )
}

export default function WeeklyCheckInPage() {
  useRequireOnboarding()
  const router = useRouter()
  const plan = getStoredPlan()
  const tier = plan.runnerTier
  const level = tierLevel(tier)

  const [runFeeling, setRunFeeling] = useState<number | null>(null)
  const [hasNiggles, setHasNiggles] = useState<boolean | null>(null)
  const [nigglesNote, setNigglesNote] = useState('')
  const [suppWork, setSuppWork] = useState<string | null>(null)
  const [sleepQuality, setSleepQuality] = useState<number | null>(null)
  const [energyLevel, setEnergyLevel] = useState<number | null>(null)
  const [hrv, setHrv] = useState('')
  const [notes, setNotes] = useState('')

  const canSubmit = runFeeling !== null && hasNiggles !== null && suppWork !== null

  const handleSubmit = () => {
    const checkIn: Record<string, unknown> = {
      type: 'weekly',
      runFeeling,
      hasNiggles,
      nigglesNote: hasNiggles ? (nigglesNote.trim() || null) : null,
      supplementaryWork: suppWork,
      freeTextNotes: notes.trim() || null,
      createdAt: new Date().toISOString(),
      // Map to fields the review/generate API also reads
      confidenceScore: runFeeling,
      painBefore: 0,
      painDuring: 0,
      painAfter: 0,
      nextDayStiffness: 0,
    }

    if (level >= 2) {
      checkIn.sleepQuality = sleepQuality
      checkIn.energyLevel = energyLevel
    }
    if (level >= 3) {
      checkIn.hrv = hrv ? Number(hrv) : null
    }

    const history = JSON.parse(localStorage.getItem('sb_checkin_history') ?? '[]')
    localStorage.setItem('sb_checkin_history', JSON.stringify([...history, checkIn]))
    localStorage.setItem('sb_checkin_latest', JSON.stringify(checkIn))

    router.push('/review')
  }

  return (
    <div className="min-h-screen bg-white pb-44">
      <div className="bg-sb-primary px-6 pt-12 pb-6">
        <div className="w-full max-w-[480px] mx-auto">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Weekly check-in</p>
          <h1 className="text-xl font-bold text-white">How was your week?</h1>
          <p className="text-white/60 text-sm mt-1">Your answers help adjust next week&apos;s plan.</p>
        </div>
      </div>

      <div className="w-full max-w-[480px] mx-auto px-6 pt-6">

        {/* Running */}
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">How did your runs feel this week?</p>
          <ButtonGrid options={RUN_FEELING_OPTIONS} value={runFeeling} onChange={setRunFeeling} />
        </div>

        {/* Niggles */}
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Any niggles or tightness?</p>
          <div className="flex gap-2 mb-3">
            {[{ label: 'Yes', value: true }, { label: 'No — all good', value: false }].map(({ label, value }) => (
              <button
                key={label}
                type="button"
                style={{ touchAction: 'manipulation' }}
                onClick={() => setHasNiggles(value)}
                className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-colors ${
                  hasNiggles === value ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {hasNiggles && (
            <textarea
              value={nigglesNote}
              onChange={(e) => setNigglesNote(e.target.value)}
              placeholder="Where and when? e.g. left knee after long run, eased off quickly"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#333] leading-relaxed resize-none focus:outline-none focus:border-sb-primary-mid"
            />
          )}
        </div>

        {/* Supplementary work */}
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">How much supplementary work did you do?</p>
          <p className="text-xs text-[#555]/60 mb-3">Prevention and performance exercises from your plan</p>
          <ButtonGrid options={SUPP_WORK_OPTIONS} value={suppWork} onChange={setSuppWork} />
        </div>

        {/* Sleep & energy (intermediate+) */}
        {level >= 2 && (
          <>
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Sleep quality this week</p>
              <ButtonGrid options={SLEEP_OPTIONS} value={sleepQuality} onChange={setSleepQuality} />
            </div>
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Energy levels this week</p>
              <ButtonGrid options={ENERGY_OPTIONS} value={energyLevel} onChange={setEnergyLevel} />
            </div>
          </>
        )}

        {/* HRV (advanced+) */}
        {level >= 3 && (
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">
              Morning HRV <span className="normal-case font-normal text-[#555]/40">(optional)</span>
            </p>
            <input
              type="number"
              value={hrv}
              onChange={(e) => setHrv(e.target.value)}
              placeholder="e.g. 62"
              className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
            />
          </div>
        )}

        {/* Notes */}
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">
            Anything else <span className="normal-case font-normal text-[#555]/40">(optional)</span>
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How's training going overall? Anything your coach should know?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#333] leading-relaxed resize-none focus:outline-none focus:border-sb-primary-mid"
          />
        </div>

      </div>

      <BottomNav />

      <div className="fixed bottom-16 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4">
        <div className="w-full max-w-[480px] mx-auto">
          <Button
            className="w-full h-12 text-base rounded-xl"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Submit & view weekly review
          </Button>
        </div>
      </div>
    </div>
  )
}
