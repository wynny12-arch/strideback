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
      // Only use cache for successful results — never cache null/failures
      if (cached && cached !== 'null') {
        setGifUrl(cached)
        return
      }
    } catch { /* ignore */ }

    setLoading(true)
    fetch(`/api/exercise-gif?name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(data => {
        const url: string | null = data.gifUrl ?? null
        // Only cache successful GIF URLs
        if (url) {
          try { localStorage.setItem(cacheKey(name), url) } catch { /* ignore */ }
        }
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

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' exercise tutorial')}`

  if (!gifUrl) {
    return (
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs font-semibold text-red-500 mb-3"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z"/>
        </svg>
        Watch on YouTube
      </a>
    )
  }

  return (
    <div className="mb-3">
      <div className="w-full rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center mb-2" style={{ maxHeight: '220px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gifUrl}
          alt={`${name} demonstration`}
          className="w-auto object-contain"
          style={{ maxHeight: '220px' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs font-semibold text-red-500"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z"/>
        </svg>
        Watch on YouTube
      </a>
    </div>
  )
}
