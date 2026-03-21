'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
// TODO: Replace with live Claude API call POST /api/intake-summariser
import intakeSummaryMock from '@/mocks/intake-summary.json'

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

function getSaved(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}') } catch { return {} }
}

export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const saved = getSaved()
    if (saved.pastedNotes) setNotes(saved.pastedNotes as string)
  }, [])

  const handleSubmit = () => {
    localStorage.setItem('sb_onboarding', JSON.stringify({ ...getSaved(), pastedNotes: notes }))
    // TODO: Replace with live Claude API call — for now store the mock intake summary
    localStorage.setItem('sb_intake_summary', JSON.stringify(intakeSummaryMock))
    router.push('/safety')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[480px] mx-auto px-6 pt-12 pb-32">
        <Link href="/onboarding/symptoms" className="mb-6 p-2 -ml-2 inline-flex text-[#555]" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <ProgressBar step={4} />

        <h2 className="text-2xl font-bold text-sb-primary mt-6 mb-1">Any clinical notes?</h2>
        <p className="text-sm mb-8" style={{ color: '#555', opacity: 0.7 }}>
          Optional — paste anything from a physio, GP, or scan report. This helps us build a more accurate plan.
        </p>

        <div className="mb-6 bg-sb-primary-light/50 rounded-xl p-4 flex gap-3 items-start">
          <FileText className="w-5 h-5 text-sb-primary-mid shrink-0 mt-0.5" />
          <p className="text-sm text-[#555] leading-relaxed">
            You can paste discharge notes, physio assessments, scan reports, or any clinical correspondence.
          </p>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste clinical notes here (optional)..."
          rows={10}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#333] leading-relaxed resize-none focus:outline-none focus:border-sb-primary-mid"
        />

        <p className="mt-4 text-xs leading-relaxed" style={{ color: '#555', opacity: 0.55 }}>
          Your information is processed locally and used only to generate your rehab plan. Nothing is stored on our servers in this prototype.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4">
        <div className="w-full max-w-[480px] mx-auto">
          <Button
            className="w-full h-12 text-base rounded-xl"
            onClick={handleSubmit}
          >
            Generate my plan
          </Button>
        </div>
      </div>
    </div>
  )
}
