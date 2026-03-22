'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { CheckCircle2, Circle, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/bottom-nav'

interface CheckIn {
  painBefore: number
  painDuring: number
  painAfter: number
  nextDayStiffness: number
  confidenceScore: number
  freeTextNotes: string | null
  running?: { didRun: boolean | null; sessions: string | null; painDuringRun: number | null } | null
  createdAt: string
}

const CONFIDENCE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Struggled', color: '#C0392B' },
  2: { label: 'Managed', color: '#F5A623' },
  3: { label: 'Felt good', color: '#1F7A4D' },
  4: { label: 'Easy', color: '#1F7A4D' },
}

const DECISION_CONFIG = {
  progress: { label: 'Progressing load', bg: 'bg-[#E8F5EE]', border: 'border-[#A8D5BC]', text: 'text-sb-success', Icon: TrendingUp },
  hold: { label: 'Holding at current load', bg: 'bg-[#FEF3CD]', border: 'border-[#F5D98B]', text: 'text-[#B07D00]', Icon: Minus },
  regress: { label: 'Reducing load this week', bg: 'bg-[#FEF3CD]', border: 'border-[#F5D98B]', text: 'text-[#B07D00]', Icon: TrendingDown },
}

const PAIN_COLOR = '#2E6DA4'

function avg(nums: number[]) {
  if (!nums.length) return 0
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

function PainBadge({ value }: { value: number }) {
  const color = value <= 3 ? '#1F7A4D' : value <= 6 ? '#B07D00' : '#C0392B'
  return (
    <span className="text-xl font-bold" style={{ color }}>
      {value}<span className="text-sm font-normal text-[#555]/50">/10</span>
    </span>
  )
}

function getSaved(key: string, fallback: unknown = {}) {
  try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)) } catch { return fallback }
}

export default function ReviewPage() {
  useRequireOnboarding()
  const router = useRouter()
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [completedDays, setCompletedDays] = useState<number[]>([])
  const [totalSessions, setTotalSessions] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [nextPlan, setNextPlan] = useState<Record<string, unknown> | null>(null)
  const planPromiseRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    const history: CheckIn[] = getSaved('sb_checkin_history', [])
    const recentCheckIns = history.slice(-3)
    setCheckIns(recentCheckIns)
    const completed: number[] = getSaved('sb_completed_days', [])
    setCompletedDays(completed)
    const plan = getSaved('sb_plan', {})
    if (plan.strengthSessions?.length) setTotalSessions(plan.strengthSessions.length)

    // Start generating next plan in background immediately
    const onboarding = getSaved('sb_onboarding', {})
    const medicalUpdates = getSaved('sb_medical_updates', [])
    planPromiseRef.current = fetch('/api/generate-next-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboarding, previousPlan: plan, checkIns: recentCheckIns, medicalUpdates }),
    }).then(async (res) => {
      if (res.ok) {
        const generated = await res.json()
        setNextPlan(generated)
      }
    }).catch(() => { /* silently fall back */ })
  }, [])

  const sessionsCompleted = completedDays.length
  const hasData = checkIns.length > 0

  const avgPainBefore = avg(checkIns.map(c => c.painBefore))
  const avgPainDuring = avg(checkIns.map(c => c.painDuring))
  const avgPainAfter = avg(checkIns.map(c => c.painAfter))
  const avgStiffness = avg(checkIns.map(c => c.nextDayStiffness))

  const chartData = checkIns.map((c, i) => ({
    name: `S${i + 1}`,
    before: c.painBefore,
    during: c.painDuring,
    after: c.painAfter,
  }))

  const notes = checkIns.filter(c => c.freeTextNotes).map(c => c.freeTextNotes as string)

  const handleStartNextWeek = async () => {
    setGenerating(true)
    try {
      await planPromiseRef.current
      if (nextPlan) {
        localStorage.setItem('sb_plan', JSON.stringify(nextPlan))
      }
    } finally {
      localStorage.removeItem('sb_completed_days')
      // Keep checkin history but don't clear it — it accumulates across weeks
      setGenerating(false)
      router.replace('/plan')
    }
  }

  const decision = nextPlan?.progressionDecision as 'progress' | 'hold' | 'regress' | undefined
  const decisionConfig = decision ? DECISION_CONFIG[decision] : null

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="bg-sb-primary px-6 pt-12 pb-8">
        <div className="w-full max-w-[480px] mx-auto">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Weekly review</p>
          <h1 className="text-xl font-bold text-white leading-snug">
            {sessionsCompleted} of {totalSessions} sessions completed
          </h1>
        </div>
      </div>

      <div className="w-full max-w-[480px] mx-auto px-6 pt-6">

        {/* Session completion */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Sessions this week</p>
          <div className="flex gap-3">
            {Array.from({ length: totalSessions }).map((_, i) => {
              const done = completedDays.includes(i)
              return (
                <div key={i} className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border ${done ? 'border-sb-success bg-[#E8F5EE]' : 'border-gray-200 bg-gray-50'}`}>
                  {done
                    ? <CheckCircle2 className="w-6 h-6 text-sb-success" />
                    : <Circle className="w-6 h-6 text-gray-300" />
                  }
                  <span className={`text-xs font-semibold ${done ? 'text-sb-success' : 'text-[#555]/40'}`}>
                    Day {i * 2 + 1}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {hasData ? (
          <>
            {/* Pain summary */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Average pain this week</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Before', value: avgPainBefore },
                  { label: 'During', value: avgPainDuring },
                  { label: 'After', value: avgPainAfter },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl px-3 py-4 flex flex-col items-center gap-1">
                    <span className="text-xs text-[#555]/50 font-medium">{label}</span>
                    <PainBadge value={value} />
                  </div>
                ))}
              </div>
            </div>

            {/* Pain chart */}
            {chartData.length > 1 && (
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Pain by session</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={chartData} barGap={2} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} width={20} />
                      <Bar dataKey="before" radius={[3, 3, 0, 0]}>
                        {chartData.map((_, i) => <Cell key={i} fill={`${PAIN_COLOR}55`} />)}
                      </Bar>
                      <Bar dataKey="during" radius={[3, 3, 0, 0]}>
                        {chartData.map((_, i) => <Cell key={i} fill={PAIN_COLOR} />)}
                      </Bar>
                      <Bar dataKey="after" radius={[3, 3, 0, 0]}>
                        {chartData.map((_, i) => <Cell key={i} fill={`${PAIN_COLOR}99`} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-1">
                    {[{ label: 'Before', op: '55' }, { label: 'During', op: '' }, { label: 'After', op: '99' }].map(({ label, op }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: `${PAIN_COLOR}${op}` }} />
                        <span className="text-xs text-[#555]/60">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Confidence per session */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">How sessions felt</p>
              <div className="space-y-2">
                {checkIns.map((c, i) => {
                  const conf = CONFIDENCE_LABELS[c.confidenceScore] ?? { label: '—', color: '#999' }
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-[#333] font-medium">Session {i + 1}</span>
                      <span className="text-sm font-semibold" style={{ color: conf.color }}>{conf.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stiffness */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Avg next-morning stiffness</p>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                {avgStiffness > 5
                  ? <AlertTriangle className="w-5 h-5 text-sb-caution shrink-0" />
                  : <CheckCircle2 className="w-5 h-5 text-sb-success shrink-0" />
                }
                <div>
                  <PainBadge value={avgStiffness} />
                  <p className="text-xs text-[#555]/60 mt-0.5">
                    {avgStiffness > 5 ? 'Above threshold — load reduced next week' : 'Within acceptable range'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {notes.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Your notes</p>
                <div className="space-y-2">
                  {notes.map((note, i) => (
                    <div key={i} className="px-4 py-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-[#555] leading-snug">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mb-6 px-4 py-6 bg-gray-50 rounded-xl text-center">
            <p className="text-sm text-[#555]/60 leading-relaxed">No check-in data yet. Complete a session and check in to see your weekly summary here.</p>
          </div>
        )}

        {/* AI progression decision */}
        {decisionConfig && (
          <div className={`mb-6 rounded-xl border p-4 ${decisionConfig.bg} ${decisionConfig.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <decisionConfig.Icon className={`w-4 h-4 shrink-0 ${decisionConfig.text}`} />
              <p className={`text-xs font-semibold uppercase tracking-wide ${decisionConfig.text}`}>
                Next week — {decisionConfig.label}
              </p>
            </div>
            <p className="text-sm text-[#333] leading-relaxed">{nextPlan?.decisionReason as string}</p>
          </div>
        )}

        {!nextPlan && (
          <div className="mb-6 px-4 py-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-[#555]/50 text-center">Building your next plan…</p>
          </div>
        )}

      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4">
        <div className="w-full max-w-[480px] mx-auto">
          <Button
            className="w-full h-12 text-base rounded-xl"
            onClick={handleStartNextWeek}
            disabled={generating}
          >
            {generating ? 'Building your next plan…' : 'Start next week'}
          </Button>
          {generating && (
            <p className="mt-2 text-xs text-center text-[#555]/50">Claude is generating your next plan</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
