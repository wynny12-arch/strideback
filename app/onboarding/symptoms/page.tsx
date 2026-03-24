'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

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

function PainSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-sm font-medium text-[#333]">{label}</span>
        <span className="text-lg font-bold text-sb-primary-mid">{value}<span className="text-sm font-normal text-[#555]/60">/10</span></span>
      </div>
      <Slider
        min={0} max={10} step={1}
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

const AGGRAVATING_OPTIONS = [
  'Running', 'Walking', 'Sitting', 'Stairs',
  'Lifting / loading', 'Cycling', 'Standing', 'Lying down',
]

const TOLERANCE_OPTIONS = [
  { value: 'cannot_walk', label: "Can't walk without pain" },
  { value: 'can_walk', label: 'Can walk comfortably' },
  { value: 'can_jog', label: 'Can jog slowly' },
  { value: 'can_run', label: 'Can run (with some discomfort)' },
]

function getSaved(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}') } catch { return {} }
}

export default function SymptomsPage() {
  const router = useRouter()

  const [onsetDate, setOnsetDate] = useState('')
  const [hasDiagnosis, setHasDiagnosis] = useState<'yes' | 'no' | 'not_sure' | null>(null)
  const [diagnosisName, setDiagnosisName] = useState('')
  const [painScoreWorst, setPainScoreWorst] = useState(5)
  const [painScoreCurrent, setPainScoreCurrent] = useState(3)
  const [aggravatingFactors, setAggravatingFactors] = useState<string[]>([])
  const [currentTolerance, setCurrentTolerance] = useState<string | null>(null)

  useEffect(() => {
    const saved = getSaved()
    if (saved.onsetDate) setOnsetDate(saved.onsetDate as string)
    if (saved.hasDiagnosis) setHasDiagnosis(saved.hasDiagnosis as 'yes' | 'no' | 'not_sure')
    if (saved.diagnosisName) setDiagnosisName(saved.diagnosisName as string)
    if (typeof saved.painScoreWorst === 'number') setPainScoreWorst(saved.painScoreWorst)
    if (typeof saved.painScoreCurrent === 'number') setPainScoreCurrent(saved.painScoreCurrent)
    if (Array.isArray(saved.aggravatingFactors)) setAggravatingFactors(saved.aggravatingFactors as string[])
    if (saved.currentTolerance) setCurrentTolerance(saved.currentTolerance as string)
  }, [])

  const toggleFactor = (factor: string) => {
    setAggravatingFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    )
  }

  const canContinue = onsetDate.trim() && hasDiagnosis && currentTolerance

  const handleContinue = () => {
    localStorage.setItem('sb_onboarding', JSON.stringify({
      ...getSaved(),
      onsetDate, hasDiagnosis, diagnosisName,
      painScoreWorst, painScoreCurrent, aggravatingFactors, currentTolerance,
    }))
    router.push('/onboarding/notes')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[480px] mx-auto px-6 pt-12 pb-32">
        <Link href="/onboarding/injury-area" className="mb-6 p-2 -ml-2 inline-flex text-[#555]" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <ProgressBar step={3} />

        <h2 className="text-2xl font-bold text-sb-primary mt-6 mb-1">Your symptoms</h2>
        <p className="text-sm mb-8" style={{ color: '#555', opacity: 0.7 }}>
          Be as accurate as you can — this shapes your plan.
        </p>

        {/* Onset */}
        <div className="mb-7">
          <label className="block text-sm font-medium text-[#333] mb-1.5">Tell us about your injury</label>
          <textarea
            value={onsetDate}
            onChange={(e) => setOnsetDate(e.target.value)}
            placeholder="e.g. Started 6 weeks ago after a long run. Sharp pain at the back of my heel, worse in the morning and after sitting for long periods..."
            rows={4}
            className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid resize-none"
          />
        </div>

        {/* Diagnosis — small 3-button row, intentional taps */}
        <div className="mb-7">
          <p className="text-sm font-medium text-[#333] mb-3">Do you have a diagnosis?</p>
          <div className="flex gap-2">
            {([
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'not_sure', label: 'Not sure' },
            ] as { value: 'yes' | 'no' | 'not_sure'; label: string }[]).map(({ value, label }) => {
              const selected = hasDiagnosis === value
              return (
                <button
                  key={value}
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={() => setHasDiagnosis(value)}
                  className={`flex-1 h-11 rounded-xl border text-sm font-medium ${
                    selected ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          {hasDiagnosis === 'yes' && (
            <input
              type="text"
              value={diagnosisName}
              onChange={(e) => setDiagnosisName(e.target.value)}
              placeholder="e.g. Proximal hamstring tendinopathy"
              className="mt-3 w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
            />
          )}
        </div>

        {/* Pain scores */}
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-5">Pain scores</p>
          <PainSlider label="Worst pain (past 2 weeks)" value={painScoreWorst} onChange={setPainScoreWorst} />
          <PainSlider label="Current pain right now" value={painScoreCurrent} onChange={setPainScoreCurrent} />
        </div>

        {/* Aggravating factors — small chips, intentional taps */}
        <div className="mb-7">
          <p className="text-sm font-medium text-[#333] mb-3">
            What makes it worse? <span className="font-normal text-[#555]/50">(select all that apply)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {AGGRAVATING_OPTIONS.map((factor) => {
              const selected = aggravatingFactors.includes(factor)
              return (
                <button
                  key={factor}
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={() => toggleFactor(factor)}
                  className={`px-3 py-2 rounded-full border text-sm ${
                    selected ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'
                  }`}
                >
                  {factor}
                </button>
              )
            })}
          </div>
        </div>

        {/* Current tolerance */}
        <div className="mb-7">
          <p className="text-sm font-medium text-[#333] mb-3">Current activity tolerance</p>
          <div className="flex flex-wrap gap-2">
            {TOLERANCE_OPTIONS.map(({ value, label }) => {
              const selected = currentTolerance === value
              return (
                <button
                  key={value}
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={() => setCurrentTolerance(value)}
                  className={`px-3 py-2 rounded-full border text-sm ${
                    selected ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
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
