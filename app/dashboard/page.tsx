'use client'

import { useState, useEffect } from 'react'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import { Flame, TrendingUp, Calendar, Target } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { useRouter } from 'next/navigation'
import planData from '@/mocks/rehab-plan.json'
import dashMock from '@/mocks/dashboard.json'
import type { RehabPlan } from '@/types'

const plan = planData as RehabPlan
const TOTAL_SESSIONS = plan.strengthSessions.length

const PAIN_COLOR = '#2E6DA4'
const BAR_COLOR = '#2E6DA4'

interface StoredCheckIn {
  painBefore: number
  painDuring: number
  painAfter: number
  nextDayStiffness: number
  confidenceScore: number | null
  freeTextNotes: string | null
  createdAt: string
}

interface DashStats {
  readinessScore: number
  painTrend: { date: string; pain: number }[]
  weeklyLoad: { week: string; sessions: number }[]
  sessionConsistency: number
  streak: number
  weeklyReviewDue: boolean
  usingReal: boolean
}

function computeStats(history: StoredCheckIn[], completedDays: number[]): DashStats {
  if (history.length === 0) {
    return { ...dashMock, usingReal: false }
  }

  // Pain trend — one point per check-in
  const painTrend = history.map((c) => ({
    date: new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    pain: c.painAfter,
  }))

  // Readiness — 100 minus scaled avg pain from last 3 check-ins
  const recent = history.slice(-3)
  const avgPain = recent.reduce((sum, c) => sum + c.painAfter, 0) / recent.length
  const readinessScore = Math.round(Math.max(10, Math.min(100, 100 - avgPain * 10)))

  // Streak — number of check-ins submitted
  const streak = history.length

  // Consistency — completed sessions vs total this week
  const sessionConsistency = Math.round((completedDays.length / TOTAL_SESSIONS) * 100)

  // Weekly load — group check-ins by ISO week
  const weekMap = new Map<string, number>()
  history.forEach((c) => {
    const d = new Date(c.createdAt)
    const jan1 = new Date(d.getFullYear(), 0, 1)
    const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
    const key = `W${weekNum}`
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1)
  })
  const weeklyLoad = Array.from(weekMap.entries()).map(([week, sessions]) => ({ week, sessions }))

  const weeklyReviewDue = completedDays.length >= TOTAL_SESSIONS

  return { readinessScore, painTrend, weeklyLoad, sessionConsistency, streak, weeklyReviewDue, usingReal: true }
}

function ReadinessRing({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = score >= 70 ? '#1F7A4D' : score >= 40 ? '#F5A623' : '#C0392B'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-sb-primary">{score}</span>
          <span className="text-xs text-[#555]/60 font-medium">/ 100</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-[#333] mt-2">Readiness score</p>
    </div>
  )
}

export default function DashboardPage() {
  useRequireOnboarding()
  const router = useRouter()
  const [stats, setStats] = useState<DashStats>({ ...dashMock, usingReal: false })

  useEffect(() => {
    const history: StoredCheckIn[] = JSON.parse(localStorage.getItem('sb_checkin_history') ?? '[]')
    const completedDays: number[] = JSON.parse(localStorage.getItem('sb_completed_days') ?? '[]')
    setStats(computeStats(history, completedDays))
  }, [])

  const { readinessScore, painTrend, weeklyLoad, sessionConsistency, streak, weeklyReviewDue } = stats

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="bg-sb-primary px-6 pt-12 pb-6">
        <div className="w-full max-w-[480px] mx-auto">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Progress</p>
          <h1 className="text-xl font-bold text-white">{dashMock.currentPhase}</h1>
        </div>
      </div>

      <div className="w-full max-w-[480px] mx-auto px-6">

        {/* Weekly review banner */}
        {weeklyReviewDue && (
          <button
            type="button"
            onClick={() => router.push('/review')}
            onTouchEnd={(e) => { e.preventDefault(); router.push('/review') }}
            className="w-full flex items-center justify-between mt-5 p-4 rounded-xl bg-sb-primary text-white"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">Ready</p>
              <p className="text-sm font-semibold">Your weekly review is due</p>
            </div>
            <span className="text-white/60 text-xl">→</span>
          </button>
        )}

        {/* Readiness + stats */}
        <div className="mt-6 flex items-center gap-6">
          <ReadinessRing score={readinessScore} />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-sb-caution shrink-0" />
              <div>
                <p className="text-xs text-[#555]/50">Streak</p>
                <p className="text-base font-bold text-[#333]">{streak} {streak === 1 ? 'session' : 'sessions'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sb-success shrink-0" />
              <div>
                <p className="text-xs text-[#555]/50">This week</p>
                <p className="text-base font-bold text-[#333]">{sessionConsistency}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-sb-primary-mid shrink-0" />
              <div>
                <p className="text-xs text-[#555]/50">Next milestone</p>
                <p className="text-xs font-semibold text-[#333] leading-snug">{dashMock.nextMilestone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pain trend */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Pain after sessions</p>
          {painTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={painTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#999' }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.floor(painTrend.length / 5) - 1)}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fontSize: 10, fill: '#999' }}
                  tickLine={false}
                  axisLine={false}
                  ticks={[0, 5, 10]}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v) => [`${v}/10`, 'Pain after']}
                />
                <Line
                  type="monotone"
                  dataKey="pain"
                  stroke={PAIN_COLOR}
                  strokeWidth={2}
                  dot={{ r: 4, fill: PAIN_COLOR }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#555]/50 text-center py-8">Complete a session to see your pain trend.</p>
          )}
        </div>

        {/* Weekly load */}
        <div className="mt-8 mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Sessions per week</p>
          {weeklyLoad.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyLoad} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: '#999' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 5]}
                  tick={{ fontSize: 10, fill: '#999' }}
                  tickLine={false}
                  axisLine={false}
                  ticks={[0, 2, 4]}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v) => [v, 'Sessions']}
                />
                <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                  {weeklyLoad.map((_, i) => (
                    <Cell key={i} fill={i === weeklyLoad.length - 1 ? BAR_COLOR : '#D5E8F0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#555]/50 text-center py-8">Complete a session to see your weekly load.</p>
          )}
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
