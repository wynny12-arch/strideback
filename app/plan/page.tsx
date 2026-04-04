'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, StopCircle, HeartPulse, Shield, Zap } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { ExerciseGif } from '@/components/exercise-gif'
import planMock from '@/mocks/rehab-plan.json'
import type { RehabPlan, RunnerTier, RunnerGoal } from '@/types'

function getStoredPlan(): RehabPlan {
  try {
    const stored = localStorage.getItem('sb_plan')
    if (stored) return JSON.parse(stored) as RehabPlan
  } catch { /* fall through */ }
  return planMock as RehabPlan
}

const TIER_CONFIG: Record<RunnerTier, {
  label: string
  accent: string
  headerBg: string
  traits: string[]
  checkinDesc: string
}> = {
  novice: {
    label: 'Novice Runner',
    accent: '#6B7280',
    headerBg: 'bg-sb-primary',
    traits: ['Building your running base', 'Focused on safe progression', 'Simple weekly check-ins'],
    checkinDesc: 'Weekly check-in',
  },
  intermediate: {
    label: 'Intermediate Runner',
    accent: '#5B6EF5',
    headerBg: 'bg-sb-primary',
    traits: ['1–3 years running', 'Regular racer or consistent trainer', 'Check-ins every few days'],
    checkinDesc: 'Check in every 3–4 days',
  },
  advanced: {
    label: 'Advanced Runner',
    accent: '#1D3A6E',
    headerBg: 'bg-sb-primary',
    traits: ['Competitive runner', 'High weekly training load', 'Detailed progress tracking'],
    checkinDesc: 'Check in every 2–3 days',
  },
  semi_elite: {
    label: 'Semi-Elite Runner',
    accent: '#1A9E5C',
    headerBg: 'bg-sb-primary',
    traits: ['Marathon < 3hrs or 5k < 17min', 'Daily monitoring & HRV tracking', 'Full data integration'],
    checkinDesc: 'Daily check-in',
  },
}

const GOAL_PHASES: {
  goal: RunnerGoal
  icon: React.ElementType
  label: string
  activeDesc: string
  nextDesc: string
  laterDesc: string
  color: string
  activeBg: string
  inactiveBg: string
}[] = [
  {
    goal: 'rehab',
    icon: HeartPulse,
    label: 'Rehab',
    activeDesc: 'Active now — exercises targeting your injury, guided return to running.',
    nextDesc: 'Starts first to address your injury.',
    laterDesc: 'Included if you add rehab to your goals.',
    color: 'text-sb-caution',
    activeBg: 'bg-sb-caution',
    inactiveBg: 'bg-sb-caution/10',
  },
  {
    goal: 'prevention',
    icon: Shield,
    label: 'Prevention',
    activeDesc: 'Active now — prehab and stability work to keep you injury-free.',
    nextDesc: 'Woven in as your rehab progresses and pain reduces.',
    laterDesc: 'Included if you add prevention to your goals.',
    color: 'text-sb-success',
    activeBg: 'bg-sb-success',
    inactiveBg: 'bg-sb-success/10',
  },
  {
    goal: 'optimisation',
    icon: Zap,
    label: 'Performance',
    activeDesc: 'Active now — strength and power work to improve your running economy.',
    nextDesc: 'Added once rehab is progressing well.',
    laterDesc: 'Included if you add performance to your goals.',
    color: 'text-sb-primary-mid',
    activeBg: 'bg-sb-primary-mid',
    inactiveBg: 'bg-sb-primary-mid/10',
  },
]

const DISCLAIMER = 'StrideBack provides structured guidance and educational support for self-managed rehabilitation. It is not a substitute for professional medical diagnosis or treatment.'

// Extract the exercise name from a text string like "Bulgarian split squats 3 × 8 reps — reason"
function extractExerciseName(item: string): string {
  return item.replace(/\s+\d.*/, '').replace(/\s*[—–].*/, '').trim()
}

function TextExerciseItem({ item, index, accentColor }: { item: string; index: number; accentColor: string }) {
  const [expanded, setExpanded] = useState(false)
  const name = extractExerciseName(item)
  return (
    <li className="bg-gray-50 rounded-xl overflow-hidden">
      <button
        type="button"
        style={{ touchAction: 'manipulation' }}
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-2 px-3 py-2.5 text-left"
      >
        <span className={`font-bold shrink-0 text-sm ${accentColor}`}>{index + 1}.</span>
        <span className="text-sm text-[#555] leading-snug flex-1">{item}</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#999] shrink-0 mt-0.5" /> : <ChevronDown className="w-3.5 h-3.5 text-[#999] shrink-0 mt-0.5" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          <ExerciseGif name={name} show={expanded} />
        </div>
      )}
    </li>
  )
}

export default function PlanPage() {
  const router = useRouter()
  useRequireOnboarding()
  const [plan, setPlan] = useState<RehabPlan>(planMock as RehabPlan)
  const [runningExpanded, setRunningExpanded] = useState(false)
  const [rulesExpanded, setRulesExpanded] = useState(false)
  const [preventionExpanded, setPreventionExpanded] = useState(false)
  const [optimisationExpanded, setOptimisationExpanded] = useState(false)
  const [sessionsExpanded, setSessionsExpanded] = useState<boolean[]>([])
  const [completedDays, setCompletedDays] = useState<number[]>([])
  const [dailyDoneToday, setDailyDoneToday] = useState(false)
  const [weeklyDoneThisWeek, setWeeklyDoneThisWeek] = useState(false)

  useEffect(() => {
    setPlan(getStoredPlan())
    const stored = JSON.parse(localStorage.getItem('sb_completed_days') ?? '[]')
    setCompletedDays(stored)
    const p = getStoredPlan()
    setSessionsExpanded(new Array(p.strengthSessions?.length ?? 3).fill(false))

    const today = new Date().toDateString()
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const history: Record<string, unknown>[] = JSON.parse(localStorage.getItem('sb_checkin_history') ?? '[]')
    setDailyDoneToday(history.some(c => c.type === 'daily' && new Date(c.createdAt as string).toDateString() === today))
    setWeeklyDoneThisWeek(history.some(c => c.type === 'weekly' && new Date(c.createdAt as string).getTime() > weekAgo))
  }, [])

  const goals = plan.runnerGoals ?? []
  const activePhases = plan.activePhases ?? (goals.includes('rehab') ? ['rehab'] : goals)
  const hasRehab = goals.includes('rehab')
  const tierConfig = plan.runnerTier ? TIER_CONFIG[plan.runnerTier] : null

  const preventionActive = activePhases.includes('prevention')
  const optimisationActive = activePhases.includes('optimisation')

  // Determine phase status for each goal
  function phaseStatus(goal: RunnerGoal): 'active' | 'next' | 'not-selected' {
    if (!goals.includes(goal)) return 'not-selected'
    if (activePhases.includes(goal)) return 'active'
    return 'next'
  }

  return (
    <div className="min-h-screen bg-white pb-44">

      {/* ── Tier Hero ─────────────────────────────────────────────────────── */}
      <div className="bg-sb-primary px-6 pt-12 pb-8">
        <div className="w-full max-w-[480px] mx-auto">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">Your runner profile</p>

          {tierConfig ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">{tierConfig.label}</h1>
              <p className="text-white/60 text-sm mb-5">{tierConfig.checkinDesc}</p>
              <div className="flex flex-col gap-2">
                {tierConfig.traits.map((trait, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                    <p className="text-white/80 text-sm">{trait}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <h1 className="text-2xl font-bold text-white">{plan.phase}</h1>
          )}
        </div>
      </div>

      {/* ── Journey Roadmap ───────────────────────────────────────────────── */}
      <div className="bg-sb-primary-light px-6 py-6 border-b border-gray-100">
        <div className="w-full max-w-[480px] mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Your journey</p>

          <div className="flex gap-3">
            {GOAL_PHASES.map((phase, i) => {
              const status = phaseStatus(phase.goal)
              const isActive = status === 'active'
              const isNext = status === 'next'
              const notSelected = status === 'not-selected'
              const Icon = phase.icon
              const ordinal = goals.includes(phase.goal)
                ? goals.indexOf(phase.goal) + (hasRehab && phase.goal !== 'rehab' ? 1 : 1)
                : null

              // Calculate position label
              let positionLabel = ''
              if (isActive) positionLabel = hasRehab && phase.goal === 'rehab' ? 'Phase 1 · Now' : 'Phase 1 · Now'
              else if (isNext) {
                const pos = goals.indexOf(phase.goal) + 1
                positionLabel = `Phase ${pos} · Next`
              }

              return (
                <div
                  key={phase.goal}
                  className={`flex-1 rounded-2xl p-3 flex flex-col gap-2 transition-all ${
                    isActive ? 'bg-white shadow-sm border-2 border-sb-primary-mid' : notSelected ? 'bg-white/40 border border-dashed border-gray-200' : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? phase.activeBg : notSelected ? 'bg-gray-100' : phase.inactiveBg}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : notSelected ? 'text-gray-300' : phase.color}`} />
                  </div>
                  <div>
                    {positionLabel ? (
                      <p className={`text-[10px] font-semibold mb-0.5 ${isActive ? 'text-sb-primary-mid' : 'text-[#999]'}`}>{positionLabel}</p>
                    ) : null}
                    <p className={`text-xs font-bold leading-tight ${isActive ? 'text-sb-primary' : notSelected ? 'text-gray-300' : 'text-[#555]'}`}>{phase.label}</p>
                  </div>
                  <p className={`text-[10px] leading-snug ${isActive ? 'text-[#555]' : notSelected ? 'text-gray-300' : 'text-[#777]'}`}>
                    {isActive ? phase.activeDesc : isNext ? phase.nextDesc : phase.laterDesc}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Rehab-first note */}
          {hasRehab && goals.length > 1 && (
            <div className="mt-4 flex items-start gap-2 bg-white rounded-xl px-4 py-3 border border-gray-100">
              <span className="text-base mt-0.5">💡</span>
              <p className="text-xs text-[#555] leading-relaxed">
                Rehab comes first. Other phases will be woven in progressively as your recovery advances.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-[480px] mx-auto px-6">
        {/* Current phase */}
        {tierConfig && (
          <div className="py-5 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-1">Current phase</p>
            <p className="text-base font-bold text-sb-primary">{plan.phase}</p>
            <p className="text-sm text-[#555] leading-relaxed mt-1">{plan.planGoal}</p>
          </div>
        )}

        {!tierConfig && (
          <div className="py-6 border-b border-gray-100">
            <p className="text-sm text-[#555] leading-relaxed">{plan.planGoal}</p>
          </div>
        )}

        {/* Running allowance */}
        <div className="py-6 border-b border-gray-100">
          <div className={`rounded-xl p-4 ${plan.runningAllowance.allowed ? 'bg-[#E8F5EE]' : 'bg-[#FEF3CD]'}`}>
            <div className="flex items-center gap-2 mb-2">
              {plan.runningAllowance.allowed
                ? <CheckCircle2 className="w-5 h-5 text-sb-success shrink-0" />
                : <XCircle className="w-5 h-5 text-sb-caution shrink-0" />
              }
              <p className="font-semibold text-sm text-sb-primary">
                {plan.runningAllowance.allowed ? 'Running: allowed this week' : 'Running: not recommended this week'}
              </p>
            </div>
            <p className="text-sm text-[#555] leading-relaxed mb-3">{plan.runningAllowance.guidance}</p>
            {plan.runningAllowance.allowed && (
              <>
                <button
                  type="button"
                  onClick={() => setRunningExpanded(v => !v)}
                  onTouchEnd={(e) => { e.preventDefault(); setRunningExpanded(v => !v) }}
                  className="flex items-center gap-1 text-xs font-semibold text-sb-primary-mid"
                >
                  {runningExpanded ? 'Hide protocol' : 'View run protocol'}
                  {runningExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {runningExpanded && (
                  <ul className="mt-3 space-y-2">
                    {plan.runningAllowance.protocol.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#555]">
                        <span className="text-sb-primary-mid font-bold shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        {/* Rehab sessions */}
        {hasRehab && plan.strengthSessions.length > 0 && (
          <div className="py-6 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-5">Rehab sessions</p>
            <div>
              {plan.strengthSessions.map((session, i) => {
                const done = completedDays.includes(i)
                const isLast = i === plan.strengthSessions.length - 1
                const expanded = sessionsExpanded[i] ?? false
                const toggleExpand = () => setSessionsExpanded(prev => {
                  const next = [...prev]
                  next[i] = !next[i]
                  return next
                })

                return (
                  <div key={session.day} className="flex gap-4">
                    {/* Icon + connector */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-sb-success' : 'bg-sb-caution'}`}>
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-white" />
                          : <HeartPulse className="w-4 h-4 text-white" />
                        }
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: '28px' }} />
                      )}
                    </div>
                    {/* Content */}
                    <div className={`flex-1 ${!isLast ? 'pb-6' : 'pb-2'}`}>
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-bold text-[#222]">{session.day}</p>
                        {done
                          ? <span className="text-[10px] font-semibold bg-sb-success text-white px-2 py-0.5 rounded-full">Completed</span>
                          : <span className="text-[10px] font-semibold bg-sb-primary text-white px-2 py-0.5 rounded-full">Up next</span>
                        }
                      </div>
                      <p className="text-xs text-sb-caution font-semibold mb-1">{session.focus}</p>
                      <p className="text-sm text-[#555] leading-relaxed mb-3">{session.exercises.length} exercises · targeted rehab work</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleExpand}
                          className="flex items-center gap-1 text-xs font-semibold text-sb-primary-mid"
                        >
                          {expanded ? 'Hide exercises' : 'View exercises'}
                          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {!done && (
                          <>
                            <span className="text-gray-300">·</span>
                            <button
                              type="button"
                              onClick={() => router.push(`/session?day=${i}`)}
                              onTouchEnd={(e) => { e.preventDefault(); router.push(`/session?day=${i}`) }}
                              className="flex items-center gap-1 text-xs font-semibold text-sb-caution"
                            >
                              Start session <ChevronDown className="w-3 h-3 -rotate-90" />
                            </button>
                          </>
                        )}
                      </div>
                      {expanded && (
                        <ul className="mt-3 space-y-2">
                          {session.exercises.map((ex, j) => (
                            <li key={j} className="bg-gray-50 rounded-xl px-3 py-3">
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-sb-caution font-bold text-sm shrink-0">{j + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[#222] leading-snug">{ex.name}</p>
                                  <p className="text-xs text-[#555]/70 mt-0.5">
                                    {ex.sets} sets × {ex.reps}
                                    {ex.tempo ? ` · ${ex.tempo}` : ''}
                                  </p>
                                </div>
                              </div>
                              <ExerciseGif name={ex.name} show={expanded} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Non-rehab check-in CTA */}
        {!hasRehab && plan.runnerTier === 'semi_elite' && (
          <div className="py-6 border-b border-gray-100">
            <div className="bg-sb-primary-light/60 rounded-xl p-4">
              {dailyDoneToday ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-sb-success shrink-0" />
                    <p className="font-semibold text-sm text-sb-primary">Today&apos;s check-in done</p>
                  </div>
                  <p className="text-sm text-[#555] leading-relaxed">Come back tomorrow to log your next daily check-in.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-sm text-sb-primary mb-1">Daily check-in</p>
                  <p className="text-sm text-[#555] leading-relaxed mb-3">Log sleep, energy, HRV and any niggles — takes about 30 seconds.</p>
                  <button
                    type="button"
                    onClick={() => router.push('/checkin-daily')}
                    onTouchEnd={(e) => { e.preventDefault(); router.push('/checkin-daily') }}
                    className="text-xs font-semibold text-sb-primary-mid flex items-center gap-1"
                  >
                    Check in now <ChevronDown className="w-3 h-3 -rotate-90" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {!hasRehab && plan.runnerTier !== 'semi_elite' && (
          <div className="py-6 border-b border-gray-100">
            <div className="bg-sb-primary-light/60 rounded-xl p-4">
              {weeklyDoneThisWeek ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-sb-success shrink-0" />
                    <p className="font-semibold text-sm text-sb-primary">Weekly check-in done</p>
                  </div>
                  <p className="text-sm text-[#555] leading-relaxed">Your coach has your data for this week. Check back after your next weekly review.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-sm text-sb-primary mb-1">How was your week?</p>
                  <p className="text-sm text-[#555] leading-relaxed mb-3">Check in weekly so your coach can adjust your plan based on how you&apos;re responding.</p>
                  <button
                    type="button"
                    onClick={() => router.push('/checkin-weekly')}
                    onTouchEnd={(e) => { e.preventDefault(); router.push('/checkin-weekly') }}
                    className="text-xs font-semibold text-sb-primary-mid flex items-center gap-1"
                  >
                    Weekly check-in <ChevronDown className="w-3 h-3 -rotate-90" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Week complete banner */}
        {hasRehab && plan.strengthSessions.length > 0 && completedDays.length >= plan.strengthSessions.length && (
          <div className="py-6 border-b border-gray-100">
            <div className="bg-[#E8F5EE] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-sb-success shrink-0" />
                <p className="font-semibold text-sm text-sb-primary">Great week — all sessions done!</p>
              </div>
              <p className="text-sm text-[#555] leading-relaxed mb-3">Time to review your progress and adjust your plan for next week.</p>
              <button
                type="button"
                onClick={() => router.push('/review')}
                onTouchEnd={(e) => { e.preventDefault(); router.push('/review') }}
                className="text-xs font-semibold text-sb-primary-mid flex items-center gap-1"
              >
                Start weekly review <ChevronDown className="w-3 h-3 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* Prevention + Optimisation — journey-style with dropdowns */}
        {(preventionActive || optimisationActive) && (
          <div className="py-6 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-5">Your plan</p>
            <div className="space-y-0">

              {preventionActive && plan.preventionWork && plan.preventionWork.length > 0 && (
                <div className="flex gap-4">
                  {/* Icon + connector */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-xl bg-sb-success flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    {optimisationActive && (
                      <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: '28px' }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-bold text-[#222]">Injury Prevention</p>
                      <span className="text-[10px] font-semibold bg-sb-primary text-white px-2 py-0.5 rounded-full">Active now</span>
                    </div>
                    <p className="text-xs text-sb-success font-semibold mb-1">Starting immediately</p>
                    <p className="text-sm text-[#555] leading-relaxed mb-3">Prehab and stability work to keep you resilient and injury-free.</p>
                    <button
                      type="button"
                      onClick={() => setPreventionExpanded(v => !v)}
                      className="flex items-center gap-1 text-xs font-semibold text-sb-primary-mid"
                    >
                      {preventionExpanded ? 'Hide exercises' : 'View exercises'}
                      {preventionExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {preventionExpanded && (
                      <ul className="mt-3 space-y-2">
                        {plan.preventionWork.map((item, i) => (
                          <TextExerciseItem key={i} item={item} index={i} accentColor="text-sb-success" />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {optimisationActive && plan.optimisationWork && plan.optimisationWork.length > 0 && (
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-xl bg-sb-primary-mid flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-bold text-[#222]">Performance</p>
                      <span className="text-[10px] font-semibold bg-sb-primary text-white px-2 py-0.5 rounded-full">Active now</span>
                    </div>
                    <p className="text-xs text-sb-primary-mid font-semibold mb-1">
                      {preventionActive ? 'Running alongside prevention' : 'Starting immediately'}
                    </p>
                    <p className="text-sm text-[#555] leading-relaxed mb-3">Strength and power work to improve your running economy and speed.</p>
                    <button
                      type="button"
                      onClick={() => setOptimisationExpanded(v => !v)}
                      className="flex items-center gap-1 text-xs font-semibold text-sb-primary-mid"
                    >
                      {optimisationExpanded ? 'Hide exercises' : 'View exercises'}
                      {optimisationExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {optimisationExpanded && (
                      <ul className="mt-3 space-y-2">
                        {plan.optimisationWork.map((item, i) => (
                          <TextExerciseItem key={i} item={item} index={i} accentColor="text-sb-primary-mid" />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Mobility & recovery */}
        <div className="py-6 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Mobility & recovery</p>
          <ul className="space-y-2">
            {plan.mobilityRecovery.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#555] leading-snug">
                <span className="text-sb-primary-mid shrink-0 mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rules */}
        <div className="py-6 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setRulesExpanded(v => !v)}
            onTouchEnd={(e) => { e.preventDefault(); setRulesExpanded(v => !v) }}
            className="w-full flex items-center justify-between mb-4"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50">Progression & safety rules</p>
            {rulesExpanded ? <ChevronUp className="w-4 h-4 text-[#555]/40" /> : <ChevronDown className="w-4 h-4 text-[#555]/40" />}
          </button>
          {rulesExpanded && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-sb-success" />
                  <p className="text-xs font-semibold text-sb-success uppercase tracking-wide">Progress when</p>
                </div>
                <ul className="space-y-1.5">
                  {plan.progressionRules.map((r, i) => (
                    <li key={i} className="text-sm text-[#555] leading-snug pl-6">· {r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StopCircle className="w-4 h-4 text-sb-caution" />
                  <p className="text-xs font-semibold text-sb-stop uppercase tracking-wide">Stop or escalate if</p>
                </div>
                <ul className="space-y-1.5">
                  {plan.stopOrEscalateRules.map((r, i) => (
                    <li key={i} className="text-sm text-[#555] leading-snug pl-6">· {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Education notes */}
        <div className="py-6 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Good to know</p>
          <div className="space-y-3">
            {plan.educationNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-3 bg-sb-primary-light/50 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-sb-caution shrink-0 mt-0.5" />
                <p className="text-sm text-[#555] leading-snug">{note}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="py-6 text-xs text-[#555]/50 leading-relaxed text-center">{DISCLAIMER}</p>
      </div>

      <BottomNav />
    </div>
  )
}
