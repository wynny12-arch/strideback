'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Dumbbell, TrendingUp, RotateCcw } from 'lucide-react'

const TABS = [
  { label: 'Plan', href: '/plan', icon: ClipboardList },
  { label: 'Today', href: '/session', icon: Dumbbell },
  { label: 'Progress', href: '/dashboard', icon: TrendingUp },
  { label: 'Review', href: '/review', icon: RotateCcw },
]

export function BottomNav() {
  const pathname = usePathname()

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
              href={href === '/session' ? '/session?day=0' : href}
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
