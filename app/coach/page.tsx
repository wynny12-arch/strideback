'use client'

import { useState, useEffect, useRef } from 'react'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import type { CoachMessage } from '@/types'

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

export default function CoachPage() {
  useRequireOnboarding()
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const history = getHistory()
    setMessages(history)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: CoachMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    // Build history for API (exclude the current message, it's passed separately)
    const history = messages.map(m => ({
      role: m.role === 'coach' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }))

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          context: getContext(),
        }),
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
        content: 'Sorry, I couldn\'t connect. Check your connection and try again.',
        timestamp: new Date().toISOString(),
      }
      const finalMessages = [...updatedMessages, errorMsg]
      setMessages(finalMessages)
      saveHistory(finalMessages)
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-xl font-bold text-white">Ask your coach</h1>
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
