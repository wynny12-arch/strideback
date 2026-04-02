'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/bottom-nav'
import planMock from '@/mocks/rehab-plan.json'
import type { RehabPlan, RunnerTier } from '@/types'

function getStoredPlan(): RehabPlan {
  try {
    const stored = localStorage.getItem('sb_plan')
    if (stored) return JSON.parse(stored) as RehabPlan
  } catch { /* fall through */ }
  return planMock as RehabPlan
}

const CONFIDENCE_OPTIONS = [
  { value: 1, label: 'Struggled', sub: 'Too hard' },
  { value: 2, label: 'Managed', sub: 'With difficulty' },
  { value: 3, label: 'Felt good', sub: 'Went well' },
  { value: 4, label: 'Easy', sub: 'Ready for more' },
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

const LOAD_OPTIONS = [
  { value: 'none', label: 'Rest' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
]

function tierLevel(tier: RunnerTier | undefined): number {
  const map: Record<RunnerTier, number> = { novice: 1, intermediate: 2, advanced: 3, semi_elite: 4 }
  return tier ? map[tier] : 1
}

function PainSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-sm font-medium text-[#333]">{label}</span>
        <span className="text-lg font-bold text-sb-primary-mid">
          {value}<span className="text-sm font-normal text-[#555]/60">/10</span>
        </span>
      </div>
      <Slider
        min={0}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(typeof v === 'number' ? v : v[0])}
        className="mb-1"
      />
      <div className="flex justify-between text-xs" style={{ color: '#555', opacity: 0.5 }}>
        <span>No pain</span>
        <span>Worst imaginable</span>
      </div>
    </div>
  )
}

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
            className={`flex flex-col items-start px-3 py-3 rounded-xl border text-left ${
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

export default function CheckInPage() {
  return (
    <Suspense>
      <CheckInContent />
    </Suspense>
  )
}

function CheckInContent() {
  useRequireOnboarding()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dayIndex = searchParams.get('day')

  const plan = getStoredPlan()
  const runningAllowed = plan.runningAllowance.allowed
  const tier = plan.runnerTier
  const level = tierLevel(tier)

  // Base fields (all tiers)
  const [painBefore, setPainBefore] = useState(3)
  const [painDuring, setPainDuring] = useState(3)
  const [painAfter, setPainAfter] = useState(2)
  const [stiffness, setStiffness] = useState(2)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [didRun, setDidRun] = useState<boolean | null>(null)
  const [runSessions, setRunSessions] = useState<string | null>(null)
  const [runPain, setRunPain] = useState(2)

  // Intermediate+ fields (level >= 2)
  const [sleepQuality, setSleepQuality] = useState<number | null>(null)
  const [energyLevel, setEnergyLevel] = useState<number | null>(null)

  // Advanced+ fields (level >= 3)
  const [hrv, setHrv] = useState('')
  const [weeklyLoad, setWeeklyLoad] = useState<string | null>(null)

  const canSubmit = confidence !== null

  const handleSubmit = () => {
    const checkIn: Record<string, unknown> = {
      painBefore,
      painDuring,
      painAfter,
      nextDayStiffness: stiffness,
      confidenceScore: confidence,
      freeTextNotes: notes || null,
      running: runningAllowed ? {
        didRun,
        sessions: didRun ? runSessions : null,
        painDuringRun: didRun ? runPain : null,
      } : null,
      createdAt: new Date().toISOString(),
    }

    if (level >= 2) {
      checkIn.sleepQuality = sleepQuality
      checkIn.energyLevel = energyLevel
    }

    if (level >= 3) {
      checkIn.hrv = hrv ? Number(hrv) : null
      checkIn.weeklyTrainingLoad = weeklyLoad
    }

    localStorage.setItem('sb_checkin_latest', JSON.stringify(checkIn))
    const history = JSON.parse(localStorage.getItem('sb_checkin_history') ?? '[]')
    localStorage.setItem('sb_checkin_history', JSON.stringify([...history, checkIn]))

    if (dayIndex !== null) {
      const completed: number[] = JSON.parse(localStorage.getItem('sb_completed_days') ?? '[]')
      const day = Number(dayIndex)
      if (!completed.includes(day)) {
        localStorage.setItem('sb_completed_days', JSON.stringify([...completed, day]))
      }
    }

    router.push('/plan')
  }

  return (
    <div className="min-h-screen bg-white pb-44">
      {/* Header */}
      <div className="bg-sb-primary px-6 pt-12 pb-6">
        <div className="w-full max-w-[480px] mx-auto">
          <h1 className="text-xl font-bold text-white">How did it go?</h1>
          <p className="text-white/60 text-sm mt-1">Your check-in helps us adjust your plan.</p>
        </div>
      </div>

      <div className="w-full max-w-[480px] mx-auto px-6 pt-6">
        {/* Pain scores */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-5">Pain scores</p>
          <PainSlider label="Pain before the session" value={painBefore} onChange={setPainBefore} />
          <PainSlider label="Pain during the session" value={painDuring} onChange={setPainDuring} />
          <PainSlider label="Pain immediately after" value={painAfter} onChange={setPainAfter} />
          <div className="mb-2">
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-sm font-medium text-[#333]">Expected next-morning stiffness</span>
              <span className="text-lg font-bold text-sb-primary-mid">
                {stiffness}<span className="text-sm font-normal text-[#555]/60">/10</span>
              </span>
            </div>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[stiffness]}
              onValueChange={(v) => setStiffness(typeof v === 'number' ? v : v[0])}
              className="mb-1"
            />
            <div className="flex justify-between text-xs" style={{ color: '#555', opacity: 0.5 }}>
              <span>None</span>
              <span>Severe</span>
            </div>
          </div>
        </div>

        {/* Sleep & energy (intermediate+) */}
        {level >= 2 && (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Last night's sleep</p>
              <ButtonGrid options={SLEEP_OPTIONS} value={sleepQuality} onChange={setSleepQuality} />
            </div>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Energy level today</p>
              <ButtonGrid options={ENERGY_OPTIONS} value={energyLevel} onChange={setEnergyLevel} />
            </div>
          </>
        )}

        {/* HRV & weekly load (advanced+) */}
        {level >= 3 && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Training load & recovery</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#333] mb-2">Morning HRV <span className="text-xs text-[#999]">(optional)</span></label>
              <input
                type="number"
                value={hrv}
                onChange={(e) => setHrv(e.target.value)}
                placeholder="e.g. 62"
                className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-[#333] mb-3">This week's training load</p>
              <ButtonGrid options={LOAD_OPTIONS} value={weeklyLoad} onChange={setWeeklyLoad} cols={4} />
            </div>
          </div>
        )}

        {/* Confidence */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">How did it feel overall?</p>
          <ButtonGrid options={CONFIDENCE_OPTIONS} value={confidence} onChange={setConfidence} />
        </div>

        {/* Running — only shown if running is allowed this week */}
        {runningAllowed && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Running this week</p>
            <p className="text-sm font-medium text-[#333] mb-3">Did you run?</p>
            <div className="flex gap-2 mb-4">
              {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map(({ label, value }) => {
                const selected = didRun === value
                return (
                  <button
                    key={label}
                    type="button"
                    style={{ touchAction: 'manipulation' }}
                    onClick={() => setDidRun(value)}
                    className={`flex-1 h-11 rounded-xl border text-sm font-medium ${
                      selected ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {didRun && (
              <>
                <p className="text-sm font-medium text-[#333] mb-3">How many sessions?</p>
                <div className="flex gap-2 mb-4">
                  {['1', '2', '3+'].map((opt) => {
                    const selected = runSessions === opt
                    return (
                      <button
                        key={opt}
                        type="button"
                        style={{ touchAction: 'manipulation' }}
                        onClick={() => setRunSessions(opt)}
                        className={`flex-1 h-11 rounded-xl border text-sm font-medium ${
                          selected ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                <PainSlider label="Pain during running" value={runPain} onChange={setRunPain} />
              </>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Notes <span className="normal-case font-normal">(optional)</span></p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything to note about today's session..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#333] leading-relaxed resize-none focus:outline-none focus:border-sb-primary-mid"
          />
        </div>
      </div>

      <BottomNav />

      {/* Fixed CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4">
        <div className="w-full max-w-[480px] mx-auto">
          <Button
            className="w-full h-12 text-base rounded-xl"
            onClick={handleSubmit}
            onTouchEnd={(e: React.TouchEvent) => { e.preventDefault(); if (canSubmit) handleSubmit() }}
            disabled={!canSubmit}
          >
            Submit check-in
          </Button>
        </div>
      </div>
    </div>
  )
}
