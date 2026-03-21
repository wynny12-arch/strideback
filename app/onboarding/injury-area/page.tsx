'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { InjuryRegion } from '@/types'

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

const REGIONS: { value: InjuryRegion; label: string; detail: string }[] = [
  { value: 'knee', label: 'Knee', detail: 'Front, side or behind' },
  { value: 'hamstring', label: 'Hamstring', detail: 'Back of thigh / sit bone' },
  { value: 'achilles', label: 'Achilles', detail: 'Back of heel / lower calf' },
  { value: 'hip', label: 'Hip & Glute', detail: 'Hip flexor, piriformis' },
  { value: 'calf', label: 'Calf', detail: 'Gastrocnemius / soleus' },
  { value: 'foot_ankle', label: 'Foot & Ankle', detail: 'Plantar fascia, ankle' },
  { value: 'lower_back', label: 'Lower Back', detail: 'Lumbar / SI joint' },
  { value: 'other', label: 'Other', detail: 'Not listed above' },
]

function getSaved(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}') } catch { return {} }
}

export default function InjuryAreaPage() {
  const router = useRouter()
  const [region, setRegion] = useState<InjuryRegion | null>(null)

  useEffect(() => {
    const saved = getSaved()
    if (saved.region) setRegion(saved.region as InjuryRegion)
  }, [])

  const handleContinue = () => {
    localStorage.setItem('sb_onboarding', JSON.stringify({ ...getSaved(), region }))
    router.push('/onboarding/symptoms')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[480px] mx-auto px-6 pt-12 pb-32">
        <Link href="/onboarding/profile" className="mb-6 p-2 -ml-2 inline-flex text-[#555]" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <ProgressBar step={2} />

        <h2 className="text-2xl font-bold text-sb-primary mt-6 mb-1">Where is your injury?</h2>
        <p className="text-sm mb-8" style={{ color: '#555', opacity: 0.7 }}>
          Select the area that best describes your pain or problem.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {REGIONS.map(({ value, label, detail }) => {
            const selected = region === value
            return (
              <div
                key={value}
                className={`flex items-center justify-between px-4 py-4 rounded-xl border ${
                  selected ? 'border-sb-primary-mid bg-sb-primary-mid' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm leading-snug ${selected ? 'text-white' : 'text-[#333]'}`}>
                    {label}
                  </p>
                  <p className={`text-xs mt-0.5 leading-snug ${selected ? 'text-white/70' : 'text-[#555]/60'}`}>
                    {detail}
                  </p>
                </div>
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={() => setRegion(value)}
                  className={`p-1.5 -mr-1 shrink-0 ${selected ? 'text-white' : 'text-[#555]/40'}`}
                  aria-label={`Select ${label}`}
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
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4">
        <div className="w-full max-w-[480px] mx-auto">
          <Button
            className="w-full h-12 text-base rounded-xl"
            onClick={handleContinue}
            disabled={!region}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
