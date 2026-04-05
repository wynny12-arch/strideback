'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Send, Loader2, ChevronLeft } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { CoachMessage, ActivityLogEntry } from '@/types'

function getContext() {
  try {
    const profile = JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}')
    const plan = JSON.parse(localStorage.getItem('sb_plan') ?? '{}')
    const checkinHistory = JSON.parse(localStorage.getItem('sb_checkin_history') ?? '[]')
    const activityLog = JSON.parse(localStorage.getItem('sb_activity_log') ?? '[]')
    return {
      profile: Object.keys(profile).length > 0 ? profile : undefined,
      plan: Object.keys(plan).length > 0 ? plan : undefined,
      recentCheckins: checkinHistory.slice(-3),
      activityLog: activityLog.slice(-5),
    }
  } catch {
    return {}
  }
}

function getHistory(): CoachMessage[] {
  try {
    return JSON.parse(localStorage.getItem('sb_coach_history') ?? '[]')
  } catch { return [] }
}

function saveHistory(messages: CoachMessage[]) {
  // Keep last 40 messages to avoid localStorage bloat
  localStorage.setItem('sb_coach_history', JSON.stringify(messages.slice(-40)))
}

const WELCOME = "Hey! I'm your StrideBack coach. Ask me anything about your plan, your training, or how you're feeling. I'm here to help."

function buildActivityMessage(entry: ActivityLogEntry): string {
  const typeLabel = entry.type.charAt(0).toUpperCase() + entry.type.slice(1)
  const parts = [`I just logged a ${typeLabel} on ${entry.date}.`]
  const stats: string[] = []
  if (entry.distanceValue) stats.push(`${entry.distanceValue}${entry.distanceUnit ?? ''}`)
  if (entry.durationMins) stats.push(`${entry.durationMins} mins`)
  if (entry.pace) stats.push(`pace ${entry.pace}`)
  if (entry.avgHeartRate) stats.push(`HR ${entry.avgHeartRate}bpm`)
  if (stats.length) parts.push(stats.join(', ') + '.')
  parts.push(`Felt ${entry.feel}/10.`)
  if (entry.notes) parts.push(`Notes: ${entry.notes}`)
  parts.push('What do you think of this session and how will you use it in my plan?')
  return parts.join(' ')
}

export default function CoachPage() {
  return (
    <Suspense>
      <CoachContent />
    </Suspense>
  )
}

function CoachContent() {
  useRequireOnboarding()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromActivity = searchParams.get('from') === 'activity'
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const autoSentRef = useRef(false)

  useEffect(() => {
    const history = getHistory()
    setMessages(history)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-send activity recap when arriving from activity log
  useEffect(() => {
    if (!fromActivity || autoSentRef.current) return
    const raw = localStorage.getItem('sb_just_logged_activity')
    if (!raw) return
    autoSentRef.current = true
    localStorage.removeItem('sb_just_logged_activity')
    try {
      const entry = JSON.parse(raw) as ActivityLogEntry
      const message = buildActivityMessage(entry)
      sendMessage(message)
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromActivity])

  const sendMessage = async (text: string, currentMessages?: CoachMessage[]) => {
    if (!text || loading) return
    const base = currentMessages ?? messages

    const userMsg: CoachMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...base, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    const history = base.map(m => ({
      role: m.role === 'coach' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }))

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, context: getContext() }),
      })

      const data = await res.json()
      const reply = data.reply ?? 'Sorry, something went wrong. Try again.'

      const coachMsg: CoachMessage = {
        id: crypto.randomUUID(),
        role: 'coach',
        content: reply,
        timestamp: new Date().toISOString(),
      }

      const finalMessages = [...updatedMessages, coachMsg]
      setMessages(finalMessages)
      saveHistory(finalMessages)
    } catch {
      const errorMsg: CoachMessage = {
        id: crypto.randomUUID(),
        role: 'coach',
        content: "Sorry, I couldn't connect. Check your connection and try again.",
        timestamp: new Date().toISOString(),
      }
      const finalMessages = [...updatedMessages, errorMsg]
      setMessages(finalMessages)
      saveHistory(finalMessages)
    } finally {
      setLoading(false)
    }
  }

  const send = () => sendMessage(input.trim())

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-sb-primary px-6 pt-12 pb-6 shrink-0">
        <div className="w-full max-w-[480px] mx-auto">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">AI Coach</p>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Ask your coach</h1>
            {fromActivity && (
              <button
                type="button"
                onClick={() => router.push('/plan')}
                className="flex items-center gap-1 text-white/70 text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to plan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-48 pt-4">
        <div className="w-full max-w-[480px] mx-auto px-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-sb-primary-light rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-sm text-[#333] leading-relaxed">{WELCOME}</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-sb-primary text-white rounded-tr-sm'
                    : 'bg-sb-primary-light text-[#333] rounded-tl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-sb-primary-light rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-sb-primary-mid animate-spin" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-30" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 68px)' }}>
        <div className="w-full max-w-[480px] mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#333] placeholder:text-[#999] focus:outline-none focus:border-sb-primary-mid max-h-32 overflow-y-auto"
            style={{ minHeight: '44px' }}
          />
          <Button
            onClick={send}
            disabled={!input.trim() || loading}
            className="h-11 w-11 p-0 rounded-xl shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
