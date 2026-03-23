'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OtherActivity, ExperienceLevel, TrainingLoad, MainGoal } from '@/types'

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-sb-primary-mid' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

type OptionItem<T> = { value: T; label: string; sub?: string }

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: OptionItem<T>[]
  value: T | null
  onChange: (v: T) => void
  name: string
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <div
            key={opt.value}
            className={`flex items-center justify-between px-3 py-3 rounded-xl border ${
              selected ? 'border-sb-primary-mid bg-sb-primary-mid' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-snug ${selected ? 'text-white' : 'text-[#333]'}`}>
                {opt.label}
              </p>
              {opt.sub && (
                <p className={`text-xs ${selected ? 'text-white/70' : 'text-[#555]/60'}`}>{opt.sub}</p>
              )}
            </div>
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={() => { (document.activeElement as HTMLElement)?.blur(); onChange(opt.value) }}
              className={`p-1.5 -mr-1 shrink-0 ${selected ? 'text-white' : 'text-[#555]/40'}`}
              aria-label={`Select ${opt.label}`}
            >
              {selected
                ? <CheckCircle2 className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />
              }
            </button>
          </div>
        )
      })}
    </div>
  )
}

function MultiOptionGrid<T extends string>({
  options,
  values,
  onChange,
}: {
  options: OptionItem<T>[]
  values: T[]
  onChange: (v: T[]) => void
}) {
  const toggle = (val: T) => {
    const next = values.includes(val) ? values.filter(v => v !== val) : [...values, val]
    onChange(next)
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const selected = values.includes(opt.value)
        return (
          <div
            key={opt.value}
            className={`flex items-center justify-between px-3 py-3 rounded-xl border ${
              selected ? 'border-sb-primary-mid bg-sb-primary-mid' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-snug ${selected ? 'text-white' : 'text-[#333]'}`}>
                {opt.label}
              </p>
            </div>
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={() => { (document.activeElement as HTMLElement)?.blur(); toggle(opt.value) }}
              className={`p-1.5 -mr-1 shrink-0 ${selected ? 'text-white' : 'text-[#555]/40'}`}
              aria-label={`Toggle ${opt.label}`}
            >
              {selected
                ? <CheckCircle2 className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />
              }
            </button>
          </div>
        )
      })}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">{title}</p>
      {children}
    </div>
  )
}

const OTHER_ACTIVITY_OPTIONS: OptionItem<OtherActivity>[] = [
  { value: 'gym', label: 'Gym & Strength' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'team_sports', label: 'Team sports' },
  { value: 'other', label: 'Other' },
]

const EXPERIENCE_OPTIONS: OptionItem<ExperienceLevel>[] = [
  { value: 'beginner', label: 'Beginner', sub: '< 1 year' },
  { value: 'regular', label: 'Regular', sub: '1–3 years' },
  { value: 'intermediate', label: 'Intermediate', sub: '3–5 years' },
  { value: 'competitive', label: 'Competitive', sub: '5+ / racing' },
]

const LOAD_OPTIONS: OptionItem<TrainingLoad>[] = [
  { value: 'none', label: 'None', sub: 'Not training' },
  { value: 'light', label: 'Light', sub: '1–2x / week' },
  { value: 'moderate', label: 'Moderate', sub: '3–4x / week' },
  { value: 'high', label: 'High', sub: '5+ / week' },
]

const GOAL_OPTIONS: OptionItem<MainGoal>[] = [
  { value: 'return_to_running', label: 'Return to running' },
  { value: 'reduce_pain', label: 'Reduce pain' },
  { value: 'build_strength', label: 'Build strength' },
  { value: 'stay_active', label: 'Stay active' },
]

function getSaved(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}') } catch { return {} }
}

export default function ProfilePage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('')
  const [otherActivities, setOtherActivities] = useState<OtherActivity[]>([])
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null)
  const [weeklyTrainingLoad, setWeeklyTrainingLoad] = useState<TrainingLoad | null>(null)
  const [mainGoal, setMainGoal] = useState<MainGoal | null>(null)
  const [trainingPlan, setTrainingPlan] = useState('')
  const [extraOpen, setExtraOpen] = useState(false)
  const [weeklyMileage, setWeeklyMileage] = useState('')
  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'km'>('miles')
  const [longestRecentRun, setLongestRecentRun] = useState('')
  const [surface, setSurface] = useState<'road' | 'trail' | 'mixed' | 'treadmill' | null>(null)
  const [typicalPace, setTypicalPace] = useState('')
  const [targetEvent, setTargetEvent] = useState('')
  const [targetEventDate, setTargetEventDate] = useState('')

  useEffect(() => {
    const saved = getSaved()
    if (saved.firstName) setFirstName(saved.firstName as string)
    if (saved.age) setAge(String(saved.age))
    if (saved.otherActivities) setOtherActivities(saved.otherActivities as OtherActivity[])
    if (saved.experienceLevel) setExperienceLevel(saved.experienceLevel as ExperienceLevel)
    if (saved.weeklyTrainingLoad) setWeeklyTrainingLoad(saved.weeklyTrainingLoad as TrainingLoad)
    if (saved.mainGoal) setMainGoal(saved.mainGoal as MainGoal)
    if (saved.trainingPlan) setTrainingPlan(saved.trainingPlan as string)
    if (saved.weeklyMileage) setWeeklyMileage(saved.weeklyMileage as string)
    if (saved.distanceUnit) setDistanceUnit(saved.distanceUnit as 'miles' | 'km')
    if (saved.longestRecentRun) setLongestRecentRun(saved.longestRecentRun as string)
    if (saved.surface) setSurface(saved.surface as 'road' | 'trail' | 'mixed' | 'treadmill')
    if (saved.typicalPace) setTypicalPace(saved.typicalPace as string)
    if (saved.targetEvent) setTargetEvent(saved.targetEvent as string)
    if (saved.targetEventDate) setTargetEventDate(saved.targetEventDate as string)
  }, [])

  const canContinue = firstName.trim() && age && experienceLevel && weeklyTrainingLoad && mainGoal

  const handleContinue = () => {
    localStorage.setItem('sb_onboarding', JSON.stringify({
      ...getSaved(),
      firstName: firstName.trim(),
      age: Number(age),
      activityType: ['running'],
      otherActivities,
      experienceLevel,
      weeklyTrainingLoad,
      mainGoal,
      trainingPlan: trainingPlan.trim() || null,
      weeklyMileage: weeklyMileage.trim() || null,
      distanceUnit,
      longestRecentRun: longestRecentRun.trim() || null,
      surface: surface || null,
      typicalPace: typicalPace.trim() || null,
      targetEvent: targetEvent.trim() || null,
      targetEventDate: targetEventDate || null,
    }))
    router.push('/onboarding/injury-area')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[480px] mx-auto px-6 pt-12 pb-32">
        <Link href="/onboarding/welcome" className="mb-6 p-2 -ml-2 inline-flex text-[#555]" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <ProgressBar step={1} />

        <h2 className="text-2xl font-bold text-sb-primary mt-6 mb-1">About you</h2>
        <p className="text-sm mb-8" style={{ color: '#555', opacity: 0.7 }}>
          Help us tailor your plan to your background.
        </p>

        <Section title="Your details">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#333] mb-1.5">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-[#333] mb-1.5">Age</label>
              <input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="35"
                min={16}
                max={99}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
              />
            </div>
          </div>
        </Section>

        <Section title="Other training you do (optional)">
          <div className="flex items-center gap-2 bg-sb-primary-mid/10 border border-sb-primary-mid/20 rounded-xl px-3 py-2.5 mb-3">
            <span className="text-base">🏃</span>
            <p className="text-xs text-sb-primary font-medium">Running is your primary sport — that&apos;s what StrideBack is built around.</p>
          </div>
          <p className="text-xs text-[#555]/60 mb-3">Any other training? This helps us factor in your overall load when building your plan.</p>
          <MultiOptionGrid options={OTHER_ACTIVITY_OPTIONS} values={otherActivities} onChange={setOtherActivities} />
        </Section>

        <Section title="Running experience">
          <OptionGrid options={EXPERIENCE_OPTIONS} value={experienceLevel} onChange={setExperienceLevel} name="experience" />
        </Section>

        <Section title="Current weekly training">
          <OptionGrid options={LOAD_OPTIONS} value={weeklyTrainingLoad} onChange={setWeeklyTrainingLoad} name="load" />
        </Section>

        <Section title="Main goal">
          <OptionGrid options={GOAL_OPTIONS} value={mainGoal} onChange={setMainGoal} name="goal" />
        </Section>

        {/* Optional extras accordion */}
        <div className="mb-7 border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setExtraOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-4 bg-white"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-[#333]">Additional context <span className="text-xs font-normal text-[#555]/50">(optional)</span></p>
              <p className="text-xs text-[#555]/50 mt-0.5">Running profile, race goals, training plan</p>
            </div>
            {extraOpen ? <ChevronUp className="w-4 h-4 text-[#555]/40 shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#555]/40 shrink-0" />}
          </button>

          {extraOpen && (
            <div className="px-4 pb-4 border-t border-gray-100 space-y-6 pt-4">

              {/* Running profile */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Running profile</p>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[#555]">Weekly distance</label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-medium">
                      {(['miles', 'km'] as const).map((u) => (
                        <button key={u} type="button" onClick={() => setDistanceUnit(u)}
                          className={`px-3 py-1 transition-colors ${distanceUnit === u ? 'bg-sb-primary-mid text-white' : 'text-[#555]'}`}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input type="text" value={weeklyMileage} onChange={(e) => setWeeklyMileage(e.target.value)}
                    placeholder={distanceUnit === 'miles' ? 'e.g. 35' : 'e.g. 55'}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid" />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-[#555] mb-1.5">Longest recent run ({distanceUnit})</label>
                  <input type="text" value={longestRecentRun} onChange={(e) => setLongestRecentRun(e.target.value)}
                    placeholder={distanceUnit === 'miles' ? 'e.g. 18' : 'e.g. 29'}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid" />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-[#555] mb-1.5">Typical pace</label>
                  <input type="text" value={typicalPace} onChange={(e) => setTypicalPace(e.target.value)}
                    placeholder="e.g. 9 min/mile or 5:30 min/km"
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid" />
                </div>
                <label className="block text-xs font-medium text-[#555] mb-1.5">Preferred surface</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['road', 'trail', 'mixed', 'treadmill'] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setSurface(surface === s ? null : s)}
                      className={`py-2 rounded-xl border text-xs font-medium capitalize transition-colors ${surface === s ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#555]'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Race goal */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Race or event goal</p>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-[#555] mb-1.5">Event</label>
                  <input type="text" value={targetEvent} onChange={(e) => setTargetEvent(e.target.value)}
                    placeholder="e.g. London Marathon"
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#555] mb-1.5">Date</label>
                  <input type="date" value={targetEventDate} onChange={(e) => setTargetEventDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid" />
                </div>
              </div>

              {/* Training plan */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Training plan</p>
                <p className="text-xs text-[#555]/60 mb-3">Following a structured plan? Briefly describe it — e.g. "16-week marathon plan, currently week 8."</p>
                <textarea value={trainingPlan} onChange={(e) => setTrainingPlan(e.target.value)}
                  placeholder="Describe your training plan..." rows={3}
                  className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid resize-none" />
              </div>

            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4">
        <div className="w-full max-w-[480px] mx-auto">
          <Button
            className="w-full h-12 text-base rounded-xl"
            onClick={handleContinue}
            disabled={!canContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
