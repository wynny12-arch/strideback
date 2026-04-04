'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function getSavedGoals(): string[] {
  try {
    const data = JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}')
    return Array.isArray(data.goals) ? data.goals : []
  } catch { return [] }
}

export default function DisclaimerPage() {
  const router = useRouter()
  const [hasRehab, setHasRehab] = useState(false)
  const [hasPrevention, setHasPrevention] = useState(false)
  const [hasOptimisation, setHasOptimisation] = useState(false)

  useEffect(() => {
    const goals = getSavedGoals()
    setHasRehab(goals.includes('rehab'))
    setHasPrevention(goals.includes('prevention'))
    setHasOptimisation(goals.includes('optimisation'))
  }, [])

  const perfOnly = !hasRehab && (hasPrevention || hasOptimisation)

  const heading = perfOnly ? 'Before you continue' : 'Before you continue'

  const subtext = perfOnly
    ? 'Please read and acknowledge the following before starting your plan.'
    : 'Please read and acknowledge the following before starting your rehab plan.'

  const points = perfOnly
    ? [
        {
          Icon: CheckCircle2,
          color: 'text-sb-success',
          text: 'StrideBack provides evidence-based strength, prevention, and performance guidance tailored to your profile.',
        },
        {
          Icon: AlertTriangle,
          color: 'text-sb-caution',
          text: 'It is not a substitute for professional medical advice, clinical assessment, or treatment.',
        },
        {
          Icon: XCircle,
          color: 'text-sb-stop',
          text: 'If you develop pain or injury during your plan, stop the relevant exercises and seek clinical advice.',
        },
        {
          Icon: ShieldCheck,
          color: 'text-sb-primary-mid',
          text: 'If at any point you are unsure whether an exercise is right for you, consult a physiotherapist or sports medicine professional.',
        },
      ]
    : [
        {
          Icon: CheckCircle2,
          color: 'text-sb-success',
          text: 'StrideBack provides structured, evidence-based rehabilitation guidance tailored to your injury.',
        },
        {
          Icon: AlertTriangle,
          color: 'text-sb-caution',
          text: 'It is not a substitute for professional medical diagnosis, clinical assessment, or treatment.',
        },
        {
          Icon: XCircle,
          color: 'text-sb-stop',
          text: 'Do not use StrideBack if you have severe pain, neurological symptoms, or have been told to rest by a clinician.',
        },
        {
          Icon: ShieldCheck,
          color: 'text-sb-primary-mid',
          text: 'If your symptoms worsen or you are unsure at any point, stop and seek clinical advice.',
        },
      ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 w-full max-w-[480px] mx-auto px-6 pt-16 pb-32">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-sb-primary-light mb-6">
          <ShieldCheck className="w-7 h-7 text-sb-primary-mid" />
        </div>

        <h2 className="text-2xl font-bold text-sb-primary mb-2">{heading}</h2>
        <p className="text-sm text-[#555]/70 mb-8 leading-relaxed">{subtext}</p>

        <div className="space-y-4 mb-8">
          {points.map(({ Icon, color, text }, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color}`} />
              <p className="text-sm text-[#333] leading-snug">{text}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#555]/50 leading-relaxed mb-8 text-center">
          By continuing you confirm you have read and understood the above, and that you use StrideBack at your own risk.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4">
        <div className="w-full max-w-[480px] mx-auto">
          <Button
            className="w-full h-12 text-base rounded-xl"
            onClick={() => router.push('/safety')}
          >
            I understand — continue
          </Button>
        </div>
      </div>
    </div>
  )
}
