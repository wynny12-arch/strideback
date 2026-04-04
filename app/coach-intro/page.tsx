'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HeartPulse, Shield, Zap, ChevronRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RehabPlan, RunnerTier, RunnerGoal } from '@/types'

function getStoredPlan(): RehabPlan | null {
  try {
    const stored = localStorage.getItem('sb_plan')
    if (stored) return JSON.parse(stored) as RehabPlan
  } catch { /* fall through */ }
  return null
}

function getFirstName(): string {
  try {
    const data = JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}')
    return (data.firstName as string) || ''
  } catch { return '' }
}

const TIER_CONFIG: Record<RunnerTier, {
  label: string
  tagline: string
  traits: string[]
  accentClass: string
  badgeBg: string
  badgeText: string
}> = {
  novice: {
    label: 'Novice Runner',
    tagline: "You're just getting started — we'll keep things simple and build safely.",
    traits: ['Structured, beginner-friendly sessions', 'Weekly check-ins to track progress', 'Clear guidance at every step'],
    accentClass: 'bg-gray-100',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-[#555]',
  },
  intermediate: {
    label: 'Intermediate Runner',
    tagline: "You've got a solid base — we'll build on it intelligently.",
    traits: ['Progressive loading tailored to your training', 'Check-ins every 3–4 days', 'Race goal integration'],
    accentClass: 'bg-sb-primary-mid/10',
    badgeBg: 'bg-sb-primary-mid/10',
    badgeText: 'text-sb-primary-mid',
  },
  advanced: {
    label: 'Advanced Runner',
    tagline: "You train hard — your plan respects that and works around it.",
    traits: ['High-load periodisation awareness', 'Every 2–3 day check-ins with HRV & load tracking', 'Performance goals baked into recovery'],
    accentClass: 'bg-sb-primary/10',
    badgeBg: 'bg-sb-primary/10',
    badgeText: 'text-sb-primary',
  },
  semi_elite: {
    label: 'Semi-Elite Runner',
    tagline: "You're operating at a high level — your plan is built to match.",
    traits: ['Daily check-ins with sleep, HRV & load data', 'Strava/activity log integration', 'Performance and race goal optimisation'],
    accentClass: 'bg-sb-success/10',
    badgeBg: 'bg-sb-success/10',
    badgeText: 'text-sb-success',
  },
}

const PHASE_CONFIG: {
  goal: RunnerGoal
  icon: React.ElementType
  label: string
  description: string
  when: (goals: RunnerGoal[], hasRehab: boolean) => string
  iconColor: string
  activeBg: string
  inactiveBg: string
}[] = [
  {
    goal: 'rehab',
    icon: HeartPulse,
    label: 'Injury Rehab',
    description: 'Targeted sessions to address your injury and restore pain-free movement.',
    when: () => 'Starting immediately',
    iconColor: 'text-sb-caution',
    activeBg: 'bg-sb-caution',
    inactiveBg: 'bg-sb-caution/10',
  },
  {
    goal: 'prevention',
    icon: Shield,
    label: 'Injury Prevention',
    description: 'Prehab and stability work to keep you resilient and injury-free.',
    when: (goals, hasRehab) => hasRehab ? 'Woven in as rehab progresses' : 'Starting immediately',
    iconColor: 'text-sb-success',
    activeBg: 'bg-sb-success',
    inactiveBg: 'bg-sb-success/10',
  },
  {
    goal: 'optimisation',
    icon: Zap,
    label: 'Performance',
    description: 'Strength and power work to improve your running economy and speed.',
    when: (goals, hasRehab) => hasRehab ? 'Added when rehab is well progressed' : 'Layered in progressively',
    iconColor: 'text-sb-primary-mid',
    activeBg: 'bg-sb-primary-mid',
    inactiveBg: 'bg-sb-primary-mid/10',
  },
]

export default function CoachIntroPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<RehabPlan | null>(null)
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    setPlan(getStoredPlan())
    setFirstName(getFirstName())
  }, [])

  const goals = plan?.runnerGoals ?? []
  const hasRehab = goals.includes('rehab')
  const hasPrevention = goals.includes('prevention')
  const hasOptimisation = goals.includes('optimisation')
  const rehabOnly = hasRehab && !hasPrevention && !hasOptimisation
  const prevOptNoRehab = !hasRehab && hasPrevention && hasOptimisation
  const isNovice = plan?.runnerTier === 'novice'
  const activeGoals = PHASE_CONFIG.filter(p => goals.includes(p.goal))
  const tierConfig = plan?.runnerTier ? TIER_CONFIG[plan.runnerTier] : null

  const progressionBullets: { icon: string; text: string }[] = rehabOnly
    ? [
        { icon: '📊', text: 'I track your pain scores, confidence and stiffness after every session.' },
        { icon: '🛡', text: "When rehab is progressing well, I'll introduce injury prevention work — even if you haven't selected it." },
        { icon: '⚡', text: "Once prevention is established, performance work comes next. Each phase builds on the last." },
        { icon: '💡', text: "You don't need to select these goals now. I'll offer them at your weekly review when your body is ready." },
        { icon: '🔔', text: "You'll see a notification when a new phase unlocks. Your plan updates automatically." },
      ]
    : prevOptNoRehab && isNovice
    ? [
        { icon: '🛡', text: 'Prevention work starts immediately — building the stability foundation that keeps you injury-free.' },
        { icon: '⚡', text: 'Performance work layers in progressively as your foundation develops over the coming weeks.' },
        { icon: '📊', text: 'I monitor your progress each week and adjust the balance as you build.' },
        { icon: '🔔', text: "Your plan updates every week based on how you're responding." },
      ]
    : hasRehab
    ? [
        { icon: '📊', text: 'I track your pain scores, confidence and stiffness after every session.' },
        { icon: '🛡', text: `When your rehab is progressing well — pain consistently low, sessions feeling manageable — I'll start weaving in ${hasPrevention ? 'injury prevention work' : 'the next phase'}.` },
        { icon: '⚡', text: "Once prevention is established, I'll layer in performance work. Each phase builds on the last." },
        { icon: '🔔', text: "You'll get a notification at your weekly review when a new phase unlocks. Your plan updates automatically." },
      ]
    : []

  // Only show progression section when there's actual phase gating to explain
  const showProgressionSection = hasRehab || (prevOptNoRehab && isNovice)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-sb-primary px-6 pt-14 pb-10">
        <div className="w-full max-w-[480px] mx-auto">
          {/* Coach avatar */}
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
            <MessageCircle className="w-7 h-7 text-white" strokeWidth={1.5} />
          </div>

          <p className="text-white/60 text-sm mb-1">
            {firstName ? `Hi ${firstName} —` : 'Hi there —'}
          </p>
          <h1 className="text-2xl font-bold text-white leading-snug mb-3">
            I&apos;m your StrideBack coach.<br />I&apos;ll guide you every step.
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            I&apos;ve analysed your profile and mapped out your journey. Here&apos;s what I&apos;ve got planned for you.
          </p>
        </div>
      </div>

      <div className="flex-1 w-full max-w-[480px] mx-auto px-6 py-8 space-y-8">

        {/* Tier badge */}
        {tierConfig && plan?.runnerTier && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Your runner profile</p>
            <div className={`rounded-2xl p-5 ${tierConfig.accentClass}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-full bg-white ${tierConfig.badgeText}`}>
                  {tierConfig.label}
                </span>
              </div>
              <p className="text-sm text-[#333] font-medium leading-snug mb-4">{tierConfig.tagline}</p>
              <div className="space-y-2">
                {tierConfig.traits.map((trait, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#555]/30 shrink-0" />
                    <p className="text-sm text-[#555]">{trait}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Journey phases */}
        {activeGoals.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">Your journey</p>
            <div className="space-y-3">
              {activeGoals.map((phase, i) => {
                const Icon = phase.icon
                const isFirst = i === 0
                return (
                  <div key={phase.goal} className="flex gap-4">
                    {/* Step indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isFirst ? phase.activeBg : phase.inactiveBg}`}>
                        <Icon className={`w-4 h-4 ${isFirst ? 'text-white' : phase.iconColor}`} />
                      </div>
                      {i < activeGoals.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-2 mb-0" style={{ minHeight: '20px' }} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-[#222]">{phase.label}</p>
                        {isFirst && (
                          <span className="text-[10px] font-semibold bg-sb-primary text-white px-2 py-0.5 rounded-full">Active now</span>
                        )}
                      </div>
                      <p className="text-xs text-sb-primary-mid font-semibold mb-1">
                        {phase.when(goals, hasRehab)}
                      </p>
                      <p className="text-sm text-[#555] leading-relaxed">{phase.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* How I advance the journey */}
        {showProgressionSection && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">How I advance your journey</p>
            <div className="bg-sb-primary-light/60 rounded-2xl px-4 py-4 space-y-3">
              <p className="text-sm text-[#333] leading-relaxed font-medium">
                You don&apos;t decide when to move to the next phase — I do, based on your data.
              </p>
              <div className="space-y-2.5">
                {progressionBullets.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                    <p className="text-sm text-[#555] leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* How I work */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-3">How I work</p>
          <div className="space-y-3">
            {[
              { icon: '💬', text: 'Chat with me anytime in the Coach tab — about your plan, your pain, how a session went, or anything on your mind.' },
              { icon: '📤', text: 'Upload your runs or connect Strava — I\'ll use your full activity data, not just rehab sessions, to build a complete picture.' },
              { icon: '🔄', text: 'Everything you share — chats, activities, check-ins — is persistent and feeds directly into how your plan evolves. The more I know, the better your plan gets.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-sb-primary-light/60 rounded-xl px-4 py-3">
                <span className="text-base mt-0.5 shrink-0">{item.icon}</span>
                <p className="text-sm text-[#333] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CTA */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        <div className="w-full max-w-[480px] mx-auto">
          <Button
            className="w-full h-12 text-base rounded-xl flex items-center justify-center gap-2"
            onClick={() => router.push('/plan')}
          >
            View my plan
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
