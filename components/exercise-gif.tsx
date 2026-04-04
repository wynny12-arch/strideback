'use client'

const youtubeSearch = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' exercise tutorial')}`

export function ExerciseGif({ name, show }: { name: string; show: boolean }) {
  if (!show) return null

  return (
    <a
      href={youtubeSearch(name)}
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
