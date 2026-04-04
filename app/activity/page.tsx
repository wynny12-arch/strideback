'use client'

import { useState, useEffect } from 'react'
import { useRequireOnboarding } from '@/hooks/use-require-onboarding'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Plus, X, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ActivityLogEntry, ActivityLogType } from '@/types'

const ACTIVITY_TYPES: { value: ActivityLogType; label: string; emoji: string }[] = [
  { value: 'run', label: 'Run', emoji: '🏃' },
  { value: 'cycle', label: 'Cycle', emoji: '🚴' },
  { value: 'swim', label: 'Swim', emoji: '🏊' },
  { value: 'gym', label: 'Gym', emoji: '🏋️' },
  { value: 'ski', label: 'Ski', emoji: '⛷️' },
  { value: 'walk', label: 'Walk', emoji: '🚶' },
  { value: 'other', label: 'Other', emoji: '⚡' },
]

const FEEL_LABELS: Record<number, string> = {
  1: 'Terrible', 2: 'Very hard', 3: 'Hard', 4: 'Tough',
  5: 'OK', 6: 'Decent', 7: 'Good', 8: 'Great', 9: 'Very good', 10: 'Amazing',
}

function getLog(): ActivityLogEntry[] {
  try { return JSON.parse(localStorage.getItem('sb_activity_log') ?? '[]') } catch { return [] }
}

function saveLog(log: ActivityLogEntry[]) {
  localStorage.setItem('sb_activity_log', JSON.stringify(log))
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  } catch { return iso }
}

const emptyForm = {
  type: 'run' as ActivityLogType,
  date: new Date().toISOString().split('T')[0],
  durationMins: '',
  distanceValue: '',
  distanceUnit: 'miles' as 'miles' | 'km',
  pace: '',
  avgHeartRate: '',
  feel: 7,
  notes: '',
}

export default function ActivityPage() {
  useRequireOnboarding()
  const router = useRouter()
  const [log, setLog] = useState<ActivityLogEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [parsedFromImage, setParsedFromImage] = useState(false)

  useEffect(() => {
    setLog(getLog())
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setParsedFromImage(false)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setImageDataUrl(dataUrl)
      // Call Claude Vision to extract activity data
      try {
        const res = await fetch('/api/parse-activity-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUrl: dataUrl }),
        })
        if (res.ok) {
          const data = await res.json()
          setForm(f => ({
            ...f,
            type: data.activityType ?? f.type,
            durationMins: data.durationMins != null ? String(data.durationMins) : f.durationMins,
            distanceValue: data.distanceValue ?? f.distanceValue,
            distanceUnit: data.distanceUnit ?? f.distanceUnit,
            pace: data.pace ?? f.pace,
            avgHeartRate: data.avgHeartRate != null ? String(data.avgHeartRate) : f.avgHeartRate,
          }))
          setParsedFromImage(true)
        }
      } catch { /* silently skip — form fields stay empty for manual fill */ }
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const entry: ActivityLogEntry = {
      id: crypto.randomUUID(),
      date: form.date,
      type: form.type,
      durationMins: form.durationMins ? Number(form.durationMins) : null,
      distanceValue: form.distanceValue || null,
      distanceUnit: form.distanceValue ? form.distanceUnit : null,
      pace: form.pace || null,
      avgHeartRate: form.avgHeartRate ? Number(form.avgHeartRate) : null,
      feel: form.feel,
      notes: form.notes || null,
      source: imageDataUrl ? 'upload' : 'manual',
      imageDataUrl,
    }
    const updated = [entry, ...log]
    setLog(updated)
    saveLog(updated)
    setForm(emptyForm)
    setImageDataUrl(null)
    setParsedFromImage(false)
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const updated = log.filter(e => e.id !== id)
    setLog(updated)
    saveLog(updated)
  }

  const typeInfo = (t: ActivityLogType) => ACTIVITY_TYPES.find(a => a.value === t) ?? ACTIVITY_TYPES[0]

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="bg-sb-primary px-6 pt-12 pb-6">
        <div className="w-full max-w-[480px] mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Training</p>
              <h1 className="text-xl font-bold text-white">Activity log</h1>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-white/60 p-2 -mr-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[480px] mx-auto px-6">
        {/* Add activity button */}
        {!showForm && (
          <div className="py-6">
            <Button
              onClick={() => setShowForm(true)}
              className="w-full h-12 rounded-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Log activity
            </Button>
          </div>
        )}

        {/* Log form */}
        {showForm && (
          <div className="py-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-[#333]">New activity</p>
              <button type="button" onClick={() => setShowForm(false)} className="text-[#999]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type picker */}
            <div className="flex flex-wrap gap-2 mb-5">
              {ACTIVITY_TYPES.map(a => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: a.value }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.type === a.value
                      ? 'bg-sb-primary border-sb-primary text-white'
                      : 'border-gray-200 text-[#555]'
                  }`}
                >
                  <span>{a.emoji}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#555] mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
              />
            </div>

            {/* Duration & distance */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[#555] mb-1.5">Duration (mins)</label>
                <input
                  type="number"
                  value={form.durationMins}
                  onChange={(e) => setForm(f => ({ ...f, durationMins: e.target.value }))}
                  placeholder="e.g. 45"
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#555] mb-1.5">Distance</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={form.distanceValue}
                    onChange={(e) => setForm(f => ({ ...f, distanceValue: e.target.value }))}
                    placeholder="e.g. 5"
                    className="flex-1 h-11 border border-gray-200 rounded-xl px-3 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, distanceUnit: f.distanceUnit === 'miles' ? 'km' : 'miles' }))}
                    className="h-11 px-2 border border-gray-200 rounded-xl text-xs font-semibold text-[#555] shrink-0"
                  >
                    {form.distanceUnit}
                  </button>
                </div>
              </div>
            </div>

            {/* Pace & HR (run only) */}
            {(form.type === 'run' || form.type === 'cycle') && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">
                    {form.type === 'run' ? 'Pace (min/mi or /km)' : 'Avg speed'}
                  </label>
                  <input
                    type="text"
                    value={form.pace}
                    onChange={(e) => setForm(f => ({ ...f, pace: e.target.value }))}
                    placeholder={form.type === 'run' ? '7:30' : '18 mph'}
                    className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">Avg HR (bpm)</label>
                  <input
                    type="number"
                    value={form.avgHeartRate}
                    onChange={(e) => setForm(f => ({ ...f, avgHeartRate: e.target.value }))}
                    placeholder="e.g. 145"
                    className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid"
                  />
                </div>
              </div>
            )}

            {/* Feel */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#555]">How did it feel?</label>
                <span className="text-xs font-semibold text-sb-primary-mid">{form.feel}/10 — {FEEL_LABELS[form.feel]}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={form.feel}
                onChange={(e) => setForm(f => ({ ...f, feel: Number(e.target.value) }))}
                className="w-full accent-sb-primary"
              />
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#555] mb-1.5">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="How did the session go? Any pain or tightness?"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#333] resize-none focus:outline-none focus:border-sb-primary-mid"
              />
            </div>

            {/* Upload screenshot */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#555] mb-1.5">Upload screenshot (optional)</label>
              {imageDataUrl ? (
                <div>
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageDataUrl} alt="Activity screenshot" className="w-full rounded-xl border border-gray-200 max-h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageDataUrl(null); setParsedFromImage(false) }}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {uploading && (
                    <p className="text-xs text-[#555]/60 mt-2 text-center">Reading your screenshot…</p>
                  )}
                  {parsedFromImage && !uploading && (
                    <p className="text-xs text-sb-success font-semibold mt-2 text-center">Fields filled from screenshot — check and edit if needed</p>
                  )}
                </div>
              ) : (
                <label className="flex items-center gap-2 h-11 border border-dashed border-gray-300 rounded-xl px-4 cursor-pointer text-sm text-[#999]">
                  <Upload className="w-4 h-4" />
                  <span>Tap to upload Strava, Garmin or Apple screenshot</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            <Button onClick={handleSave} className="w-full h-12 rounded-xl">
              Save activity
            </Button>
          </div>
        )}

        {/* Activity list */}
        {log.length === 0 && !showForm ? (
          <div className="py-12 text-center">
            <p className="text-3xl mb-3">🏃</p>
            <p className="text-sm font-semibold text-[#333] mb-1">No activities yet</p>
            <p className="text-xs text-[#555]/60">Log your runs and cross-training here. Your coach uses this to personalise your plan.</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2 pb-6">
            {log.map((entry) => {
              const info = typeInfo(entry.type)
              return (
                <div key={entry.id} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 rounded-xl bg-sb-primary-light flex items-center justify-center text-lg shrink-0">
                    {info.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#333]">{info.label}</p>
                      <p className="text-xs text-[#999]">{formatDate(entry.date)}</p>
                      {entry.source === 'upload' && (
                        <span className="text-[10px] font-semibold bg-sb-primary-light text-sb-primary-mid px-1.5 py-0.5 rounded-full">from screenshot</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {entry.durationMins && <p className="text-xs text-[#555]">{entry.durationMins} min</p>}
                      {entry.distanceValue && <p className="text-xs text-[#555]">{entry.distanceValue} {entry.distanceUnit}</p>}
                      {entry.pace && <p className="text-xs text-[#555]">{entry.pace}</p>}
                      {entry.avgHeartRate && <p className="text-xs text-[#555]">{entry.avgHeartRate} bpm</p>}
                      <p className="text-xs text-[#555]">Feel: {entry.feel}/10</p>
                    </div>
                    {entry.notes && <p className="text-xs text-[#555]/70 mt-1 leading-snug">{entry.notes}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="text-[#999] p-1 -mr-1 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
