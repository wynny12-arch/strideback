'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  AlertTriangle,
  ShieldOff,
  Stethoscope,
  Building2,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SafetyReview, SafetyStatus } from '@/types'

// TODO: Replace these static fixtures with live Claude API call POST /api/safety-check
import safetyGreenData from '@/mocks/safety-review.json'
import safetyAmberData from '@/mocks/safety-review-amber.json'
import safetyRedData from '@/mocks/safety-review-red.json'

const DISCLAIMER =
  'StrideBack provides structured guidance and educational support for self-managed rehabilitation. It is not a substitute for professional medical diagnosis or treatment. If your symptoms change, worsen, or you are unsure, stop and seek clinical advice.'

const MOCK_BY_STATE: Record<SafetyStatus, SafetyReview> = {
  green: safetyGreenData as SafetyReview,
  amber: safetyAmberData as SafetyReview,
  red: safetyRedData as SafetyReview,
}

// DEV ONLY: visible toggle to switch between safety states for review
function DevToggle({
  current,
  onChange,
  light,
}: {
  current: SafetyStatus
  onChange: (s: SafetyStatus) => void
  light?: boolean
}) {
  if (process.env.NODE_ENV !== 'development') return null
  return (
    <div
      className={`fixed top-3 right-3 z-50 flex gap-1 rounded-lg p-1 text-xs font-mono ${
        light ? 'bg-black/15' : 'bg-black/40'
      }`}
    >
      {([
        { s: 'green', color: '#1F7A4D' },
        { s: 'amber', color: '#F5A623' },
        { s: 'red', color: '#C0392B' },
      ] as { s: SafetyStatus; color: string }[]).map(({ s, color }) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{ backgroundColor: current === s ? color : undefined, color: current === s ? '#fff' : color }}
          className={`px-2 py-1 rounded transition-colors font-bold border border-current ${
            current === s ? '' : 'opacity-60 hover:opacity-90'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

// RED: full-viewport hard stop — no navigation, no path to a plan
function RedHardStop({
  safetyData,
  onSaveAndReturn,
}: {
  safetyData: SafetyReview
  onSaveAndReturn: () => void
}) {
  return (
    <div className="fixed inset-0 bg-sb-stop text-white flex flex-col overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 w-full max-w-[480px] mx-auto">
        <ShieldOff className="w-16 h-16 mb-6 opacity-90" strokeWidth={1.5} />

        <h1 className="text-2xl font-bold text-center mb-3 leading-tight">
          Please see a clinician before continuing.
        </h1>
        <p className="text-center text-white/80 text-base mb-8 leading-relaxed">
          We&apos;ve identified symptoms that require clinical review before you
          can safely start a rehab programme.
        </p>

        {safetyData.redFlags.length > 0 && (
          <div className="w-full mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/55 mb-3">
              Concerns identified
            </p>
            <ul className="space-y-2">
              {safetyData.redFlags.map((flag, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm leading-snug"
                >
                  <span className="mt-1 text-white/50 shrink-0">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="w-full mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/55 mb-3">
            What to do next
          </p>
          <div className="space-y-3">
            {[
              {
                Icon: Stethoscope,
                title: 'See your GP',
                sub: 'Book an appointment to discuss your symptoms',
              },
              {
                Icon: Building2,
                title: 'Go to A&E if urgent',
                sub: 'If symptoms are severe or rapidly worsening',
              },
              {
                Icon: Phone,
                title: 'Contact a physio',
                sub: 'A physiotherapist can assess and guide safe next steps',
              },
            ].map(({ Icon, title, sub }) => (
              <div
                key={title}
                className="flex items-center gap-3 bg-white/15 rounded-xl px-4 py-3"
              >
                <Icon className="w-5 h-5 shrink-0 text-white/80" />
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-white/60 leading-snug">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onSaveAndReturn}
          className="w-full h-11 rounded-lg border border-white/35 text-white text-sm font-medium mb-8 transition-colors hover:bg-white/10"
        >
          Save and return later
        </button>

        <p className="text-xs text-white/50 text-center leading-relaxed">
          {DISCLAIMER}
        </p>
      </div>
    </div>
  )
}

function getSaved(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}') } catch { return {} }
}
function getMedicalUpdates(): unknown[] {
  try { return JSON.parse(localStorage.getItem('sb_medical_updates') ?? '[]') } catch { return [] }
}

export default function SafetyPage() {
  const [devState, setDevState] = useState<SafetyStatus>('green')
  const [generating, setGenerating] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const router = useRouter()
  const planPromiseRef = useRef<Promise<void> | null>(null)

  const safetyData = MOCK_BY_STATE[devState]

  // Start generating the plan immediately when the page loads
  useEffect(() => {
    localStorage.removeItem('sb_completed_days')
    const onboarding = getSaved()
    const medicalUpdates = getMedicalUpdates()
    planPromiseRef.current = fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...onboarding, medicalUpdates }),
    }).then(async (res) => {
      if (res.ok) {
        const plan = await res.json()
        localStorage.setItem('sb_plan', JSON.stringify(plan))
      }
    }).catch(() => { /* silently fall back to mock */ })
  }, [])

  const generateAndContinue = useCallback(async (dest: string) => {
    localStorage.setItem('sb_safety_review', JSON.stringify(safetyData))
    setGenerating(true)
    try {
      // If plan is already generated, this resolves instantly
      await planPromiseRef.current
    } finally {
      setGenerating(false)
      setNavigating(true)
      router.replace(dest)
    }
  }, [safetyData, router])

  const handleContinue = () => generateAndContinue('/plan')
  const handleSaveAndReturn = () => generateAndContinue('/')

  if (navigating) return <div className="min-h-screen bg-white" />

  if (safetyData.status === 'red') {
    return (
      <>
        <DevToggle current={devState} onChange={setDevState} />
        <RedHardStop safetyData={safetyData} onSaveAndReturn={handleSaveAndReturn} />
      </>
    )
  }

  const isAmber = safetyData.status === 'amber'

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: isAmber ? '#FEF3CD' : '#D5E8F0' }}
    >
      <DevToggle current={devState} onChange={setDevState} light />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 w-full max-w-[480px] mx-auto">
        {isAmber ? (
          <AlertTriangle
            className="w-16 h-16 mb-6"
            style={{ color: '#F5A623' }}
            strokeWidth={1.5}
          />
        ) : (
          <CheckCircle2
            className="w-16 h-16 mb-6 text-sb-success"
            strokeWidth={1.5}
          />
        )}

        <h1
          className="text-2xl font-bold text-center mb-3 leading-tight"
          style={{ color: '#1B3A5C' }}
        >
          {isAmber
            ? 'A few things to keep an eye on.'
            : 'You are clear to start your rehab plan.'}
        </h1>

        <p className="text-center text-base mb-8 leading-relaxed" style={{ color: '#555555' }}>
          {isAmber
            ? "We've noted some caution flags. You can still proceed, but your plan includes specific monitoring rules and escalation guidance."
            : "No concerns identified. We've built a structured recovery plan tailored to your injury and training history. Let\u2019s get started."}
        </p>

        {isAmber && safetyData.cautionFlags.length > 0 && (
          <div className="w-full mb-8 bg-white/70 rounded-xl p-4 shadow-md">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#555555' }}
            >
              Caution flags
            </p>
            <ul className="space-y-3">
              {safetyData.cautionFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                  <AlertTriangle
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: '#F5A623' }}
                  />
                  <span style={{ color: '#555555' }}>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          className="w-full h-11 text-base rounded-lg"
          onClick={handleContinue}
          disabled={generating}
        >
          {generating ? 'Building your plan…' : 'Continue to my plan'}
        </Button>
        {generating && (
          <p className="mt-3 text-xs text-center text-[#555]/60">
            Claude is generating your personalised plan — this takes about 15 seconds.
          </p>
        )}

        <p
          className="mt-8 text-xs text-center leading-relaxed"
          style={{ color: '#555555', opacity: 0.7 }}
        >
          {DISCLAIMER}
        </p>
      </div>
    </div>
  )
}
