'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OtherActivity, TrainingLoad, YearsRunning, RaceDistance } from '@/types'

// ── small reusable components ──────────────────────────────────────────────

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-sb-primary-mid' : 'bg-gray-200'}`}
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
}: {
  options: OptionItem<T>[]
  value: T | null
  onChange: (v: T) => void
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
            >
              {selected ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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
    onChange(values.includes(val) ? values.filter(v => v !== val) : [...values, val])
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
            <p className={`text-sm font-medium leading-snug flex-1 min-w-0 ${selected ? 'text-white' : 'text-[#333]'}`}>
              {opt.label}
            </p>
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={() => { (document.activeElement as HTMLElement)?.blur(); toggle(opt.value) }}
              className={`p-1.5 -mr-1 shrink-0 ${selected ? 'text-white' : 'text-[#555]/40'}`}
            >
              {selected ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function ButtonRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
            value === opt.value
              ? 'border-sb-primary-mid bg-sb-primary-mid text-white'
              : 'border-gray-200 text-[#555]'
          }`}
        >
          {opt.label}
        </button>
      ))}
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

// ── constants ──────────────────────────────────────────────────────────────

const OTHER_ACTIVITY_OPTIONS: OptionItem<OtherActivity>[] = [
  { value: 'gym', label: 'Gym & Strength' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'team_sports', label: 'Team sports' },
  { value: 'other', label: 'Other' },
]

const LOAD_OPTIONS: OptionItem<TrainingLoad>[] = [
  { value: 'none', label: 'None', sub: 'Not training' },
  { value: 'light', label: 'Light', sub: '1–2x / week' },
  { value: 'moderate', label: 'Moderate', sub: '3–4x / week' },
  { value: 'high', label: 'High', sub: '5+ / week' },
]

const YEARS_RUNNING_OPTIONS: { value: YearsRunning; label: string }[] = [
  { value: 'less_than_1', label: '< 1 yr' },
  { value: '1_to_3', label: '1–3 yrs' },
  { value: '3_to_7', label: '3–7 yrs' },
  { value: '7_plus', label: '7+ yrs' },
]

const RACE_DISTANCE_OPTIONS: { value: RaceDistance; label: string }[] = [
  { value: '5k', label: '5K' },
  { value: '10k', label: '10K' },
  { value: 'half_marathon', label: 'Half' },
  { value: 'marathon', label: 'Marathon' },
  { value: 'ultra', label: 'Ultra' },
  { value: 'other', label: 'Other' },
]

// ── helpers ────────────────────────────────────────────────────────────────

function getSaved(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}') } catch { return {} }
}

// ── page ───────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()

  // core
  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('')
  const [weeklyTrainingLoad, setWeeklyTrainingLoad] = useState<TrainingLoad | null>(null)

  // performance profile
  const [yearsRunning, setYearsRunning] = useState<YearsRunning | null>(null)
  const [marathonPb, setMarathonPb] = useState('')
  const [noMarathon, setNoMarathon] = useState(false)
  const [fiveKPb, setFiveKPb] = useState('')
  const [noFiveK, setNoFiveK] = useState(false)

  // other activities
  const [otherActivities, setOtherActivities] = useState<OtherActivity[]>([])

  // race goal
  const [raceDistance, setRaceDistance] = useState<RaceDistance | null>(null)
  const [raceEventName, setRaceEventName] = useState('')
  const [raceDate, setRaceDate] = useState('')
  const [raceGoalTime, setRaceGoalTime] = useState('')

  // running profile
  const [weeklyMileage, setWeeklyMileage] = useState('')
  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'km'>('miles')
  const [longestRecentRun, setLongestRecentRun] = useState('')
  const [surface, setSurface] = useState<'road' | 'trail' | 'mixed' | 'treadmill' | null>(null)
  const [typicalPace, setTypicalPace] = useState('')
  const [trainingPlan, setTrainingPlan] = useState('')

  // accordion
  const [extraOpen, setExtraOpen] = useState(false)

  // load saved values
  useEffect(() => {
    const s = getSaved()
    if (s.firstName) setFirstName(s.firstName as string)
    if (s.age) setAge(String(s.age))
    if (s.weeklyTrainingLoad) setWeeklyTrainingLoad(s.weeklyTrainingLoad as TrainingLoad)
    if (s.yearsRunning) setYearsRunning(s.yearsRunning as YearsRunning)
    if (s.marathonPb) setMarathonPb(s.marathonPb as string)
    if (s.noMarathon) setNoMarathon(true)
    if (s.fiveKPb) setFiveKPb(s.fiveKPb as string)
    if (s.noFiveK) setNoFiveK(true)
    if (s.otherActivities) setOtherActivities(s.otherActivities as OtherActivity[])
    if (s.weeklyMileage) setWeeklyMileage(s.weeklyMileage as string)
    if (s.distanceUnit) setDistanceUnit(s.distanceUnit as 'miles' | 'km')
    if (s.longestRecentRun) setLongestRecentRun(s.longestRecentRun as string)
    if (s.surface) setSurface(s.surface as 'road' | 'trail' | 'mixed' | 'treadmill')
    if (s.typicalPace) setTypicalPace(s.typicalPace as string)
    if (s.trainingPlan) setTrainingPlan(s.trainingPlan as string)
    // race goal
    const rg = s.raceGoal as Record<string, string> | null
    if (rg) {
      if (rg.distance) setRaceDistance(rg.distance as RaceDistance)
      if (rg.eventName) setRaceEventName(rg.eventName)
      if (rg.date) setRaceDate(rg.date)
      if (rg.goalTime) setRaceGoalTime(rg.goalTime)
    }
  }, [])

  const canContinue = Boolean(firstName.trim() && age && weeklyTrainingLoad && yearsRunning)

  const handleContinue = () => {
    const saved = getSaved()
    const goals = (saved.goals as string[]) || []

    const raceGoal = raceDistance
      ? {
          distance: raceDistance,
          eventName: raceEventName.trim() || null,
          date: raceDate || null,
          goalTime: raceGoalTime.trim() || null,
        }
      : null

    localStorage.setItem('sb_onboarding', JSON.stringify({
      ...saved,
      firstName: firstName.trim(),
      age: Number(age),
      activityType: ['running'],
      otherActivities,
      weeklyTrainingLoad,
      yearsRunning,
      marathonPb: noMarathon ? null : (marathonPb.trim() || null),
      fiveKPb: noFiveK ? null : (fiveKPb.trim() || null),
      raceGoal,
      weeklyMileage: weeklyMileage.trim() || null,
      distanceUnit,
      longestRecentRun: longestRecentRun.trim() || null,
      surface: surface || null,
      typicalPace: typicalPace.trim() || null,
      trainingPlan: trainingPlan.trim() || null,
    }))

    if (goals.includes('rehab')) {
      router.push('/onboarding/injury-area')
    } else {
      router.push('/onboarding/disclaimer')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[480px] mx-auto px-6 pt-12 pb-32">
        <Link href="/onboarding/goals" className="mb-6 p-2 -ml-2 inline-flex text-[#555]" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <ProgressDots step={2} total={2} />

        <h2 className="text-2xl font-bold text-sb-primary mt-6 mb-1">About you</h2>
        <p className="text-sm mb-8" style={{ color: '#555', opacity: 0.7 }}>
          Help us understand your background so we can tailor everything to your level.
        </p>

        {/* ── Your details ── */}
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

        {/* ── Performance profile ── */}
        <Section title="Running background">
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#333] mb-2">How long have you been running?</label>
            <ButtonRow options={YEARS_RUNNING_OPTIONS} value={yearsRunning} onChange={setYearsRunning} />
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-[#333]">Marathon PB</label>
              <button
                type="button"
                onClick={() => { setNoMarathon(v => !v); setMarathonPb('') }}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  noMarathon
                    ? 'border-sb-primary-mid bg-sb-primary-mid text-white'
                    : 'border-gray-200 text-[#555]/60'
                }`}
              >
                No marathon yet
              </button>
            </div>
            <input
              type="text"
              value={marathonPb}
              onChange={(e) => setMarathonPb(e.target.value)}
              disabled={noMarathon}
              placeholder="e.g. 3:45:00"
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid disabled:bg-gray-50 disabled:text-[#555]/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-[#333]">5K PB</label>
              <button
                type="button"
                onClick={() => { setNoFiveK(v => !v); setFiveKPb('') }}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  noFiveK
                    ? 'border-sb-primary-mid bg-sb-primary-mid text-white'
                    : 'border-gray-200 text-[#555]/60'
                }`}
              >
                Never raced
              </button>
            </div>
            <input
              type="text"
              value={fiveKPb}
              onChange={(e) => setFiveKPb(e.target.value)}
              disabled={noFiveK}
              placeholder="e.g. 22:30"
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid disabled:bg-gray-50 disabled:text-[#555]/40"
            />
          </div>
        </Section>

        <Section title="Current weekly training">
          <OptionGrid options={LOAD_OPTIONS} value={weeklyTrainingLoad} onChange={setWeeklyTrainingLoad} />
        </Section>

        {/* ── Optional extras ── */}
        <div className="mb-7 border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setExtraOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-4 bg-white"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-[#333]">
                Additional context <span className="text-xs font-normal text-[#555]/50">(optional)</span>
              </p>
              <p className="text-xs text-[#555]/50 mt-0.5">Race goal, running profile, training plan</p>
            </div>
            {extraOpen
              ? <ChevronUp className="w-4 h-4 text-[#555]/40 shrink-0" />
              : <ChevronDown className="w-4 h-4 text-[#555]/40 shrink-0" />
            }
          </button>

          {extraOpen && (
            <div className="px-4 pb-4 border-t border-gray-100 space-y-6 pt-4">

              {/* Race goal — structured */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Race goal</p>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-[#555] mb-2">Distance</label>
                  <div className="flex gap-2 flex-wrap">
                    {RACE_DISTANCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRaceDistance(raceDistance === opt.value ? null : opt.value)}
                        className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          raceDistance === opt.value
                            ? 'border-sb-primary-mid bg-sb-primary-mid text-white'
                            : 'border-gray-200 text-[#555]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-[#555] mb-1.5">Event name</label>
                  <input
                    type="text"
                    value={raceEventName}
                    onChange={(e) => setRaceEventName(e.target.value)}
                    placeholder="e.g. London Marathon"
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-[#555] mb-1.5">Race date</label>
                  <input
                    type="date"
                    value={raceDate}
                    onChange={(e) => setRaceDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#555] mb-1.5">Goal time</label>
                  <input
                    type="text"
                    value={raceGoalTime}
                    onChange={(e) => setRaceGoalTime(e.target.value)}
                    placeholder="e.g. Sub 3:30 or 1:45:00"
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
                  />
                </div>
              </div>

              {/* Other activities */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Other training</p>
                <p className="text-xs text-[#555]/60 mb-3">Any cross-training? Helps factor in your overall load.</p>
                <MultiOptionGrid options={OTHER_ACTIVITY_OPTIONS} values={otherActivities} onChange={setOtherActivities} />
              </div>

              {/* Running profile */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Running profile</p>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[#555]">Weekly distance</label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-medium">
                      {(['miles', 'km'] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setDistanceUnit(u)}
                          className={`px-3 py-1 transition-colors ${distanceUnit === u ? 'bg-sb-primary-mid text-white' : 'text-[#555]'}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={weeklyMileage}
                    onChange={(e) => setWeeklyMileage(e.target.value)}
                    placeholder={distanceUnit === 'miles' ? 'e.g. 35' : 'e.g. 55'}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-[#555] mb-1.5">Longest recent run ({distanceUnit})</label>
                  <input
                    type="text"
                    value={longestRecentRun}
                    onChange={(e) => setLongestRecentRun(e.target.value)}
                    placeholder={distanceUnit === 'miles' ? 'e.g. 18' : 'e.g. 29'}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-[#555] mb-1.5">Typical pace</label>
                  <input
                    type="text"
                    value={typicalPace}
                    onChange={(e) => setTypicalPace(e.target.value)}
                    placeholder="e.g. 9 min/mile or 5:30 min/km"
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
                  />
                </div>
                <label className="block text-xs font-medium text-[#555] mb-1.5">Preferred surface</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['road', 'trail', 'mixed', 'treadmill'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSurface(surface === s ? null : s)}
                      className={`py-2 rounded-xl border text-xs font-medium capitalize transition-colors ${
                        surface === s
                          ? 'border-sb-primary-mid bg-sb-primary-mid text-white'
                          : 'border-gray-200 text-[#555]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Training plan */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Training plan</p>
                <p className="text-xs text-[#555]/60 mb-3">
                  Following a structured plan? Briefly describe it — e.g. &ldquo;16-week marathon plan, currently week 8.&rdquo;
                </p>
                <textarea
                  value={trainingPlan}
                  onChange={(e) => setTrainingPlan(e.target.value)}
                  placeholder="Describe your training plan..."
                  rows={3}
                  className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid resize-none"
                />
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
