'use client'

import { useState, useEffect } from 'react'

function cacheKey(name: string) {
  return `sb_gif_${name.toLowerCase().replace(/\s+/g, '_')}`
}

export function ExerciseGif({ name, show }: { name: string; show: boolean }) {
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!show || fetched) return
    setFetched(true)

    // Check localStorage cache first — avoids repeat API calls
    try {
      const cached = localStorage.getItem(cacheKey(name))
      if (cached !== null) {
        setGifUrl(cached === 'null' ? null : cached)
        return
      }
    } catch { /* ignore */ }

    setLoading(true)
    fetch(`/api/exercise-gif?name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(data => {
        const url: string | null = data.gifUrl ?? null
        try { localStorage.setItem(cacheKey(name), url ?? 'null') } catch { /* ignore */ }
        setGifUrl(url)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [show, name, fetched])

  if (!show) return null

  if (loading) {
    return (
      <div className="w-full h-36 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
        <div className="w-6 h-6 rounded-full border-2 border-sb-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!gifUrl) {
    return (
      <p className="text-xs text-[#555]/40 italic mb-3">No demo available for this exercise</p>
    )
  }

  return (
    <div className="w-full rounded-xl overflow-hidden bg-gray-50 mb-3 flex items-center justify-center" style={{ maxHeight: '220px' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={gifUrl}
        alt={`${name} demonstration`}
        className="w-auto object-contain"
        style={{ maxHeight: '220px' }}
      />
    </div>
  )
}
