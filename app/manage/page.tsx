'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, CheckCircle2, Plus, Trash2, AlertCircle, RefreshCw, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { BottomNav } from '@/components/bottom-nav'
import type { OtherActivity, MedicalUpdate, MedicalUpdateType } from '@/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSaved(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('sb_onboarding') ?? '{}') } catch { return {} }
}
function saveMerge(data: Record<string, unknown>) {
  localStorage.setItem('sb_onboarding', JSON.stringify({ ...getSaved(), ...data }))
}
function getUpdates(): MedicalUpdate[] {
  try { return JSON.parse(localStorage.getItem('sb_medical_updates') ?? '[]') } catch { return [] }
}
function saveUpdates(updates: MedicalUpdate[]) {
  localStorage.setItem('sb_medical_updates', JSON.stringify(updates))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  title, summary, children, defaultOpen = false,
}: { title: string; summary: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-4 text-left bg-white"
      >
        <div>
          <p className="text-sm font-semibold text-[#222]">{title}</p>
          {!open && <p className="text-xs text-[#555]/60 mt-0.5">{summary}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#999] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#999] shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 bg-white border-t border-gray-100">{children}</div>}
    </div>
  )
}

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onClick}
        className="w-full h-11 rounded-xl bg-sb-primary-mid text-white text-sm font-semibold"
      >
        {saved ? '✓ Saved — plan will reflect changes' : 'Save changes'}
      </button>
    </div>
  )
}

function PainSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm text-[#333]">{label}</span>
        <span className="text-base font-bold text-sb-primary-mid">{value}<span className="text-xs font-normal text-[#555]/60">/10</span></span>
      </div>
      <Slider min={0} max={10} step={1} value={[value]} onValueChange={v => onChange(Array.isArray(v) ? v[0] : v)} />
      <div className="flex justify-between text-xs text-[#555]/40 mt-1">
        <span>No pain</span><span>Worst imaginable</span>
      </div>
    </div>
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REGIONS = [
  { value: 'knee', label: 'Knee' },
  { value: 'achilles', label: 'Achilles' },
  { value: 'hamstring', label: 'Hamstring' },
  { value: 'hip', label: 'Hip & Glute' },
  { value: 'calf', label: 'Calf' },
  { value: 'foot_ankle', label: 'Foot & Ankle' },
  { value: 'lower_back', label: 'Lower Back' },
  { value: 'other', label: 'Other' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner', sub: '< 1 year' },
  { value: 'regular', label: 'Regular', sub: '1–3 years' },
  { value: 'intermediate', label: 'Intermediate', sub: '3–5 years' },
  { value: 'competitive', label: 'Competitive', sub: '5+ / racing' },
]

const LOAD_OPTIONS = [
  { value: 'none', label: 'None', sub: 'Not training' },
  { value: 'light', label: 'Light', sub: '1–2x / week' },
  { value: 'moderate', label: 'Moderate', sub: '3–4x / week' },
  { value: 'high', label: 'High', sub: '5+ / week' },
]

const GOAL_OPTIONS = [
  { value: 'return_to_running', label: 'Return to running' },
  { value: 'reduce_pain', label: 'Reduce pain' },
  { value: 'build_strength', label: 'Build strength' },
  { value: 'stay_active', label: 'Stay active' },
]

const OTHER_ACTIVITIES: { value: OtherActivity; label: string }[] = [
  { value: 'gym', label: 'Gym & Strength' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'team_sports', label: 'Team sports' },
  { value: 'other', label: 'Other' },
]

const AGGRAVATING_OPTIONS = [
  'Running', 'Walking', 'Sitting', 'Stairs',
  'Lifting / loading', 'Cycling', 'Standing', 'Lying down',
]

const TOLERANCE_OPTIONS = [
  { value: 'cannot_walk', label: "Can't walk without pain" },
  { value: 'can_walk', label: 'Can walk comfortably' },
  { value: 'can_jog', label: 'Can jog slowly' },
  { value: 'can_run', label: 'Can run (with some discomfort)' },
]

const UPDATE_TYPES: { value: MedicalUpdateType; label: string }[] = [
  { value: 'physio_visit', label: 'Physio visit' },
  { value: 'new_symptom', label: 'New symptom' },
  { value: 'scan_result', label: 'Scan / test result' },
  { value: 'medication', label: 'Medication change' },
  { value: 'other', label: 'Other update' },
]

function updateTypeLabel(t: MedicalUpdateType) {
  return UPDATE_TYPES.find(u => u.value === t)?.label ?? t
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return iso }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ManagePage() {
  const router = useRouter()
  const s = getSaved()

  // Profile
  const [firstName, setFirstName] = useState((s.firstName as string) || '')
  const [age, setAge] = useState(s.age ? String(s.age) : '')
  const [experienceLevel, setExperienceLevel] = useState((s.experienceLevel as string) || '')
  const [weeklyTrainingLoad, setWeeklyTrainingLoad] = useState((s.weeklyTrainingLoad as string) || '')
  const [mainGoal, setMainGoal] = useState((s.mainGoal as string) || '')
  const [otherActivities, setOtherActivities] = useState<OtherActivity[]>((s.otherActivities as OtherActivity[]) || [])
  const [profileSaved, setProfileSaved] = useState(false)

  // Injury
  const [region, setRegion] = useState((s.region as string) || '')
  const [injurySaved, setInjurySaved] = useState(false)

  // Symptoms
  const [onsetDate, setOnsetDate] = useState((s.onsetDate as string) || '')
  const [hasDiagnosis, setHasDiagnosis] = useState<'yes' | 'no' | 'not_sure' | null>((s.hasDiagnosis as 'yes' | 'no' | 'not_sure') || null)
  const [diagnosisName, setDiagnosisName] = useState((s.diagnosisName as string) || '')
  const [painScoreWorst, setPainScoreWorst] = useState(typeof s.painScoreWorst === 'number' ? s.painScoreWorst : 5)
  const [painScoreCurrent, setPainScoreCurrent] = useState(typeof s.painScoreCurrent === 'number' ? s.painScoreCurrent : 3)
  const [aggravatingFactors, setAggravatingFactors] = useState<string[]>((s.aggravatingFactors as string[]) || [])
  const [currentTolerance, setCurrentTolerance] = useState((s.currentTolerance as string) || '')
  const [symptomsSaved, setSymptomsSaved] = useState(false)

  // Notes
  const [notes, setNotes] = useState((s.pastedNotes as string) || '')
  const [notesSaved, setNotesSaved] = useState(false)

  // Medical updates
  const [updates, setUpdates] = useState<MedicalUpdate[]>([])
  const [showAddUpdate, setShowAddUpdate] = useState(false)
  const [newUpdateType, setNewUpdateType] = useState<MedicalUpdateType>('physio_visit')
  const [newUpdateText, setNewUpdateText] = useState('')

  // Regenerate plan
  const [regenerating, setRegenerating] = useState(false)
  const [regenDone, setRegenDone] = useState(false)

  useEffect(() => { setUpdates(getUpdates()) }, [])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function saveProfile() {
    saveMerge({ firstName: firstName.trim(), age: Number(age), experienceLevel, weeklyTrainingLoad, mainGoal, otherActivities })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  function saveInjury() {
    saveMerge({ region })
    setInjurySaved(true)
    setTimeout(() => setInjurySaved(false), 3000)
  }

  function saveSymptoms() {
    saveMerge({ onsetDate, hasDiagnosis, diagnosisName, painScoreWorst, painScoreCurrent, aggravatingFactors, currentTolerance })
    setSymptomsSaved(true)
    setTimeout(() => setSymptomsSaved(false), 3000)
  }

  function saveNotes() {
    saveMerge({ pastedNotes: notes })
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 3000)
  }

  function addUpdate() {
    if (!newUpdateText.trim()) return
    const update: MedicalUpdate = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: newUpdateType,
      text: newUpdateText.trim(),
    }
    const next = [update, ...updates]
    saveUpdates(next)
    setUpdates(next)
    setNewUpdateText('')
    setShowAddUpdate(false)
  }

  function deleteUpdate(id: string) {
    const next = updates.filter(u => u.id !== id)
    saveUpdates(next)
    setUpdates(next)
  }

  function toggleActivity(val: OtherActivity) {
    setOtherActivities(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  function toggleFactor(f: string) {
    setAggravatingFactors(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  const regeneratePlan = useCallback(async () => {
    setRegenerating(true)
    setRegenDone(false)
    try {
      const onboarding = getSaved()
      const medicalUpdates = getUpdates()
      localStorage.removeItem('sb_completed_days')
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...onboarding, medicalUpdates }),
      })
      if (res.ok) {
        const plan = await res.json()
        localStorage.setItem('sb_plan', JSON.stringify(plan))
        setRegenDone(true)
        setTimeout(() => router.replace('/plan'), 1000)
      }
    } finally {
      setRegenerating(false)
    }
  }, [router])

  // ── Summaries for collapsed headers ─────────────────────────────────────────

  const profileSummary = firstName ? `${firstName}, ${age || '—'} · ${EXPERIENCE_OPTIONS.find(e => e.value === experienceLevel)?.label || 'Experience not set'}` : 'Not set'
  const injurySummary = REGIONS.find(r => r.value === region)?.label || 'Not set'
  const symptomsSummary = onsetDate ? `${onsetDate.slice(0, 40)}${onsetDate.length > 40 ? '…' : ''} · Pain ${painScoreCurrent}/10` : 'Not set'
  const notesSummary = notes ? notes.slice(0, 60) + (notes.length > 60 ? '…' : '') : 'No notes added'

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[480px] mx-auto px-4 pt-12 pb-32">

        <h2 className="text-2xl font-bold text-sb-primary mb-1">Manage my plan</h2>
        <p className="text-sm text-[#555]/70 mb-6">Edit your details or log medical updates. Changes will be applied when your plan next regenerates.</p>

        {/* Plan update notice */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Any changes you save here will be used the next time your plan is generated or reviewed.</p>
        </div>

        {/* Regenerate plan */}
        <button
          type="button"
          onClick={regeneratePlan}
          disabled={regenerating}
          className="w-full h-12 mb-3 flex items-center justify-center gap-2 rounded-xl bg-sb-primary text-white text-sm font-semibold disabled:opacity-70"
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
          {regenDone ? 'Plan ready — taking you there…' : regenerating ? 'Building your new plan…' : 'Regenerate plan now'}
        </button>

        {/* Activity log */}
        <button
          type="button"
          onClick={() => router.push('/activity')}
          className="w-full h-12 mb-5 flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#333]"
        >
          <Activity className="w-4 h-4" />
          Activity log
        </button>

        {/* ── Profile ── */}
        <SectionCard title="Your profile" summary={profileSummary}>
          <div className="mt-4 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#555] mb-1.5">First name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-[#555] mb-1.5">Age</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} min={16} max={99}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid" />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#555] mb-2">Running experience</p>
              <div className="grid grid-cols-2 gap-2">
                {EXPERIENCE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setExperienceLevel(opt.value)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left ${experienceLevel === opt.value ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'}`}>
                    <div>
                      <p className="text-xs font-medium">{opt.label}</p>
                      <p className={`text-xs ${experienceLevel === opt.value ? 'text-white/70' : 'text-[#555]/50'}`}>{opt.sub}</p>
                    </div>
                    {experienceLevel === opt.value && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#555] mb-2">Weekly training load</p>
              <div className="grid grid-cols-2 gap-2">
                {LOAD_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setWeeklyTrainingLoad(opt.value)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left ${weeklyTrainingLoad === opt.value ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'}`}>
                    <div>
                      <p className="text-xs font-medium">{opt.label}</p>
                      <p className={`text-xs ${weeklyTrainingLoad === opt.value ? 'text-white/70' : 'text-[#555]/50'}`}>{opt.sub}</p>
                    </div>
                    {weeklyTrainingLoad === opt.value && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#555] mb-2">Main goal</p>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setMainGoal(opt.value)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${mainGoal === opt.value ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'}`}>
                    <span className={`text-xs font-medium ${mainGoal === opt.value ? 'text-white' : 'text-[#333]'}`}>{opt.label}</span>
                    {mainGoal === opt.value && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#555] mb-2">Other training</p>
              <div className="flex flex-wrap gap-2">
                {OTHER_ACTIVITIES.map(opt => (
                  <button key={opt.value} type="button" onClick={() => toggleActivity(opt.value)}
                    className={`px-3 py-2 rounded-full border text-xs font-medium ${otherActivities.includes(opt.value) ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <SaveButton onClick={saveProfile} saved={profileSaved} />
          </div>
        </SectionCard>

        {/* ── Injury location ── */}
        <SectionCard title="Injury location" summary={injurySummary}>
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {REGIONS.map(r => (
                <button key={r.value} type="button" onClick={() => setRegion(r.value)}
                  className={`flex items-center justify-between px-3 py-3 rounded-xl border ${region === r.value ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'}`}>
                  <span className={`text-sm font-medium ${region === r.value ? 'text-white' : ''}`}>{r.label}</span>
                  {region === r.value && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>
            <SaveButton onClick={saveInjury} saved={injurySaved} />
          </div>
        </SectionCard>

        {/* ── Symptoms ── */}
        <SectionCard title="Symptoms & pain" summary={symptomsSummary}>
          <div className="mt-4 space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1.5">Tell us about your injury</label>
              <textarea value={onsetDate} onChange={e => setOnsetDate(e.target.value)} rows={4}
                placeholder="e.g. Started 6 weeks ago after a long run. Sharp pain at the back of my heel, worse in the morning and after sitting for long periods..."
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid resize-none" />
            </div>

            <div>
              <p className="text-xs font-medium text-[#555] mb-2">Do you have a diagnosis?</p>
              <div className="flex gap-2">
                {(['yes', 'no', 'not_sure'] as const).map(v => (
                  <button key={v} type="button" onClick={() => setHasDiagnosis(v)}
                    className={`flex-1 h-10 rounded-xl border text-xs font-medium ${hasDiagnosis === v ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'}`}>
                    {v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Not sure'}
                  </button>
                ))}
              </div>
              {hasDiagnosis === 'yes' && (
                <input value={diagnosisName} onChange={e => setDiagnosisName(e.target.value)}
                  placeholder="e.g. Proximal hamstring tendinopathy"
                  className="mt-2 w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid" />
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]/50 mb-4">Pain scores</p>
              <PainSlider label="Worst pain (past 2 weeks)" value={painScoreWorst} onChange={setPainScoreWorst} />
              <PainSlider label="Current pain right now" value={painScoreCurrent} onChange={setPainScoreCurrent} />
            </div>

            <div>
              <p className="text-xs font-medium text-[#555] mb-2">What makes it worse?</p>
              <div className="flex flex-wrap gap-2">
                {AGGRAVATING_OPTIONS.map(f => (
                  <button key={f} type="button" onClick={() => toggleFactor(f)}
                    className={`px-3 py-1.5 rounded-full border text-xs ${aggravatingFactors.includes(f) ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#555] mb-2">Current activity tolerance</p>
              <div className="flex flex-col gap-2">
                {TOLERANCE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setCurrentTolerance(opt.value)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left ${currentTolerance === opt.value ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333]'}`}>
                    <span className={`text-sm ${currentTolerance === opt.value ? 'text-white font-medium' : ''}`}>{opt.label}</span>
                    {currentTolerance === opt.value && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <SaveButton onClick={saveSymptoms} saved={symptomsSaved} />
          </div>
        </SectionCard>

        {/* ── Clinical notes ── */}
        <SectionCard title="Clinical notes" summary={notesSummary}>
          <div className="mt-4">
            <p className="text-xs text-[#555]/60 mb-3">Paste physio discharge notes, scan reports, or anything a clinician has told you.</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={6}
              placeholder="e.g. MRI confirmed grade 1 hamstring strain. Physio advised no running for 2 weeks..."
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid resize-none" />
            <SaveButton onClick={saveNotes} saved={notesSaved} />
          </div>
        </SectionCard>

        {/* ── Medical updates ── */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden mb-3 bg-white">
          <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-[#222]">Medical updates</p>
              <p className="text-xs text-[#555]/60 mt-0.5">Log new developments since starting your plan</p>
            </div>
            <button type="button" onClick={() => setShowAddUpdate(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sb-primary-mid text-white text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {showAddUpdate && (
            <div className="px-4 py-4 bg-gray-50 border-b border-gray-100">
              <div className="mb-3">
                <p className="text-xs font-medium text-[#555] mb-2">Update type</p>
                <div className="flex flex-wrap gap-2">
                  {UPDATE_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setNewUpdateType(t.value)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium ${newUpdateType === t.value ? 'border-sb-primary-mid bg-sb-primary-mid text-white' : 'border-gray-200 text-[#333] bg-white'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={newUpdateText} onChange={e => setNewUpdateText(e.target.value)} rows={3}
                placeholder="Describe what happened or what you were told…"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#333] focus:outline-none focus:border-sb-primary-mid resize-none bg-white mb-3" />
              <div className="flex gap-2">
                <Button onClick={addUpdate} disabled={!newUpdateText.trim()} className="flex-1 h-10 text-sm rounded-xl">Save update</Button>
                <button type="button" onClick={() => setShowAddUpdate(false)}
                  className="px-4 h-10 rounded-xl border border-gray-200 text-sm text-[#555]">Cancel</button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {updates.length === 0 && !showAddUpdate && (
              <p className="px-4 py-5 text-sm text-[#555]/50 text-center">No updates logged yet</p>
            )}
            {updates.map(u => (
              <div key={u.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-sb-primary-mid">{updateTypeLabel(u.type)}</span>
                    <span className="text-xs text-[#555]/50">{formatDate(u.date)}</span>
                  </div>
                  <p className="text-sm text-[#333] leading-relaxed">{u.text}</p>
                </div>
                <button type="button" onClick={() => deleteUpdate(u.id)} className="text-[#999] hover:text-red-400 mt-0.5 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
