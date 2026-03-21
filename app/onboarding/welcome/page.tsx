import Link from 'next/link'
import { Activity } from 'lucide-react'

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sb-primary-light px-6 py-12">
      <div className="w-full max-w-[480px] flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-sb-primary flex items-center justify-center mb-8 shadow-lg">
          <Activity className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>

        <h1 className="text-4xl font-bold text-sb-primary mb-2 tracking-tight">StrideBack</h1>
        <p className="text-sb-primary-mid font-semibold text-lg mb-8">Your AI-guided rehab coach</p>

        <p className="text-[#555] text-base leading-relaxed mb-12 max-w-xs">
          Tell us about your injury and training history. We&apos;ll build a structured, personalised
          rehab plan to get you back running safely.
        </p>

        <Link
          href="/onboarding/profile"
          className="w-full h-12 flex items-center justify-center rounded-xl bg-sb-primary text-white text-base font-medium"
        >
          Get started
        </Link>

        <p className="mt-6 text-xs leading-relaxed" style={{ color: '#555', opacity: 0.6 }}>
          Takes about 3 minutes · No account required
        </p>
      </div>
    </div>
  )
}
