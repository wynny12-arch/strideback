'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/bottom-nav'

const SLEEP_OPTIONS = [
  { value: 1, label: 'Poor', sub: '< 5 hrs or broken' },
  { value: 2, label: 'Fair', sub: '5–6 hrs' },
  { value: 3, label: 'Good', sub: '7–8 hrs' },
  { value: 4, label: 'Great', sub: '8+ hrs solid' },
]

const ENERGY_OPTIONS = [
  { value: 1, label: 'Drained', sub: 'Very low' },
  { value: 2, label: 'Low', sub: 'Below normal' },
  { value: 3, label: 'Normal', sub: 'Feeling OK' },
  { value: 4, label: 'High', sub: 'Energised' },
]

const SESSION_FEEL_OPTIONS = [
  { value: 1, label: 'Easy', sub: 'Felt effortless' },
  { value: 2, label: 'Good', sub: 'Solid effort' },
  { value: 3, label: 'Manageable', sub: 'A bit tough' },
  { value: 4, label: 'Tough', sub: 'Harder than expected' },
]

function ButtonGrid<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; sub?: string }[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
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

export default function DailyCheckInPage() {
  useRequireOnboarding()
  const router = useRouter()

  const [sleepQuality, setSleepQuality] = useState<number | null>(null)
  const [energyLevel, setEnergyLevel] = useState<number | null>(null)
  const [hrv, setHrv] = useState('')
  const [hasNiggles, setHasNiggles] = useState<boolean | null>(null)
  const [nigglesNote, setNigglesNote] = useState('')
  const [didTrain, setDidTrain] = useState<boolean | null>(null)
  const [sessionFeeling, setSessionFeeling] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  const canSubmit = sleepQuality !== null && energyLevel !== null && hasNiggles !== null && didTrain !== null

  const handleSubmit = () => {
    const checkIn: Record<string, unknown> = {
      type: 'daily',
      sleepQuality,
      energyLevel,
      hrv: hrv ? Number(hrv) : null,
      hasNiggles,
      nigglesNote: hasNiggles ? (nigglesNote.trim() || null) : null,
      didTrain,
      sessionFeeling: didTrain ? sessionFeeling : null,
      freeTextNotes: notes.trim() || null,
      createdAt: new Date().toISOString(),
      // compatibility fields
      confidenceScore: sessionFeeling ?? energyLevel,
      painBefore: 0,
      painDuring: 0,
      painAfter: 0,
      nextDayStiffness: 0,
    }

    const history = JSON.parse(localStorage.getItem('sb_checkin_history') ?? '[]')
    localStorage.setItem('sb_checkin_history', JSON.stringify([...history, checkIn]))
    localStorage.setItem('sb_checkin_latest', JSON.stringify(checkIn))

    router.push('/plan')
  }

  return (
    <div className="min-h-screen bg-white pb-44">
      <div className="bg-sb-primary px-6 pt-12 pb-6">
        <div className="w-full max-w-[480px] mx-auto">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Daily check-in</p>
          <h1 className="text-xl font-bold text-white">How are you feeling today?</h1>
          <p className="text-white/60 text-sm mt-1">Quick daily log — helps your coach track load and recovery.</p>
        </div>
      </div>

      <div className="w-full max-w-[480px] mx-auto px-6 pt-6">

        {/* Sleep */}
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">How did you sleep last night?</p>
          <ButtonGrid options={SLEEP_OPTIONS} value={sleepQuality} onChange={setSleepQuality} />
        </div>

        {/* Energy */}
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Energy levels today</p>
          <ButtonGrid options={ENERGY_OPTIONS} value={energyLevel} onChange={setEnergyLevel} />
        </div>

        {/* HRV */}
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
              placeholder="Where and when? e.g. left calf on this morning's run"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#333] leading-relaxed resize-none focus:outline-none focus:border-sb-primary-mid"
            />
          )}
        </div>

        {/* Did you train today? */}
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Did you train today?</p>
          <div className="flex gap-2 mb-3">
            {[{ label: 'Yes', value: true }, { label: 'Rest day', value: false }].map(({ label, value }) => (
              <button
                key={label}
                type="button"
                style={{ touchAction: 'manipulation' }}
                onClick={() => { setDidTrain(value); if (!value) setSessionFeeling(null) }}
                className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-colors ${
                  didTrain === value ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {didTrain && (
            <>
              <p className="text-xs text-[#555]/60 mb-3">How did the session feel?</p>
              <ButtonGrid options={SESSION_FEEL_OPTIONS} value={sessionFeeling} onChange={setSessionFeeling} />
            </>
          )}
        </div>

        {/* Notes */}
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">
            Anything else <span className="normal-case font-normal text-[#555]/40">(optional)</span>
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything your coach should know about today"
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
            Save check-in
          </Button>
        </div>
      </div>
    </div>
  )
}
