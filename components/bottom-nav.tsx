'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ClipboardList, Dumbbell, MessageCircle, RotateCcw, Settings2 } from 'lucide-react'

const TABS = [
  { label: 'Plan', href: '/plan', icon: ClipboardList },
  { label: 'Today', href: '/session', icon: Dumbbell },
  { label: 'Coach', href: '/coach', icon: MessageCircle },
  { label: 'Review', href: '/review', icon: RotateCcw },
  { label: 'Manage', href: '/manage', icon: Settings2 },
]

function getNextSessionDay(): number {
  try {
    const plan = JSON.parse(localStorage.getItem('sb_plan') ?? '{}')
    const completed: number[] = JSON.parse(localStorage.getItem('sb_completed_days') ?? '[]')
    const total = plan.strengthSessions?.length ?? 3
    for (let i = 0; i < total; i++) {
      if (!completed.includes(i)) return i
    }
  } catch { /* fall through */ }
  return 0
}

export function BottomNav() {
  const pathname = usePathname()
  const [todayDay, setTodayDay] = useState(0)

  useEffect(() => {
    setTodayDay(getNextSessionDay())
  }, [pathname])

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex w-full max-w-[480px] mx-auto">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={label}
              href={href === '/session' ? `/session?day=${todayDay}` : href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 ${
                active ? 'text-sb-primary' : 'text-[#999]'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
              <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
