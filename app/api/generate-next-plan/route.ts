import { NextResponse } from 'next/server'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are an expert sports physiotherapist and running coach managing a runner's multi-phase journey.

Each week you review their check-in data and generate the next week's plan. You also decide whether to advance their journey to the next phase.

PHASE PROGRESSION RULES:
The runner has selected goals (e.g. rehab, prevention, optimisation). activePhases tracks which are currently live.
runnerGoals lists all goals the runner has selected — this CAN expand if you introduce a new goal.

To unlock 'prevention':
- Average pain during sessions ≤ 3/10 for this week
- Average next-morning stiffness ≤ 4/10
- Confidence was "Felt good" or "Easy" on majority of sessions
- At least 2 sessions completed
→ Add 'prevention' to activePhases. If prevention was NOT already in runnerGoals, also add it to runnerGoals.

To unlock 'optimisation':
- Prevention must already be active
- Average pain ≤ 2/10
- Confidence was "Easy" on majority of sessions
→ Add 'optimisation' to activePhases. If not already in runnerGoals, also add it to runnerGoals.

IMPORTANT: Only introduce ONE new phase per week. If unlocking prevention this week, do not also unlock optimisation.
If conditions are not met, keep activePhases and runnerGoals unchanged.

LOAD PROGRESSION (for rehab sessions):
- PROGRESS: pain ≤ 3/10 avg, stiffness ≤ 4/10 avg, confidence mostly good/easy
- HOLD: pain 3–5/10 avg, or stiffness 4–6/10, or confidence mostly "Managed"
- REGRESS: pain > 5/10, stiffness > 6/10, or confidence mostly "Struggled", or < 2 sessions done

Exercise progression:
- Progress: increase sets by 1 OR reps by 2 OR slow tempo — not all at once
- Hold: same load, vary order or warm-up
- Regress: reduce sets by 1 OR reps by 2

Pain rules:
- ≤ 3/10 = acceptable · 4/10 = stop set · > 4/10 = stop exercise
- Next-morning stiffness > 5/10 = reduce load

Keep ALL string values concise — 15 words or fewer.
Return ONLY a single valid JSON object. No markdown, no code fences.`

function summariseCheckIns(checkIns: Record<string, unknown>[]): string {
  if (!checkIns.length) return 'No check-in data recorded.'
  const avg = (key: string) => {
    const vals = checkIns.map(c => Number(c[key])).filter(v => !isNaN(v))
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 'N/A'
  }
  const confLabels: Record<number, string> = { 1: 'Struggled', 2: 'Managed', 3: 'Felt good', 4: 'Easy' }
  const confSummary = checkIns.map((c, i) =>
    `Session ${i + 1}: ${confLabels[Number(c.confidenceScore)] ?? 'Unknown'}`
  ).join(', ')
  const notes = checkIns.filter(c => c.freeTextNotes).map(c => c.freeTextNotes).join(' | ')
  const sleepSummary = checkIns.some(c => c.sleepQuality)
    ? `\nAvg sleep quality: ${avg('sleepQuality')}/4`
    : ''
  const energySummary = checkIns.some(c => c.energyLevel)
    ? `\nAvg energy: ${avg('energyLevel')}/4`
    : ''
  const hrvSummary = checkIns.some(c => c.hrv)
    ? `\nHRV readings: ${checkIns.map(c => c.hrv ?? '—').join(', ')}`
    : ''

  return `Sessions completed: ${checkIns.length}
Average pain before: ${avg('painBefore')}/10
Average pain during: ${avg('painDuring')}/10
Average pain after: ${avg('painAfter')}/10
Average next-morning stiffness: ${avg('nextDayStiffness')}/10
Confidence: ${confSummary}${sleepSummary}${energySummary}${hrvSummary}
${notes ? `Notes: ${notes}` : ''}`
}

function summarisePreviousPlan(plan: Record<string, unknown>): string {
  const sessions = Array.isArray(plan.strengthSessions) ? plan.strengthSessions : []
  const exerciseSummary = sessions.map((s: Record<string, unknown>, i: number) => {
    const exercises = Array.isArray(s.exercises) ? s.exercises : []
    const exList = exercises.map((e: Record<string, unknown>) =>
      `${e.name} — ${e.sets} sets × ${e.reps}`
    ).join('; ')
    return `Day ${i + 1}: ${exList}`
  }).join('\n')
  return `Phase: ${plan.phase}
Goal: ${plan.planGoal}
Active phases: ${JSON.stringify(plan.activePhases ?? [])}
All selected goals: ${JSON.stringify(plan.runnerGoals ?? [])}
${exerciseSummary}`
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { onboarding, previousPlan, checkIns, medicalUpdates } = body as {
    onboarding: Record<string, unknown>
    previousPlan: Record<string, unknown>
    checkIns: Record<string, unknown>[]
    medicalUpdates: Record<string, string>[]
  }

  const {
    firstName, age, experienceLevel, weeklyTrainingLoad,
    region, currentTolerance, yearsRunning, marathonPb, fiveKPb, raceGoal,
  } = onboarding ?? {}

  const currentActivePhases: string[] = Array.isArray(previousPlan?.activePhases)
    ? previousPlan.activePhases as string[]
    : []
  const allGoals: string[] = Array.isArray(previousPlan?.runnerGoals)
    ? previousPlan.runnerGoals as string[]
    : []
  const hasRehab = allGoals.includes('rehab')
  const hasPrevention = allGoals.includes('prevention')
  const hasOptimisation = allGoals.includes('optimisation')

  const updatesText = Array.isArray(medicalUpdates) && medicalUpdates.length > 0
    ? medicalUpdates.map(u => `[${u.type}] ${u.text}`).join('\n')
    : 'None'

  const raceGoalObj = raceGoal as Record<string, string | null> | null
  const raceGoalText = raceGoalObj?.distance
    ? `${raceGoalObj.distance}${raceGoalObj.goalTime ? `, goal: ${raceGoalObj.goalTime}` : ''}`
    : 'None'

  const rehabOnly = hasRehab && !hasPrevention && !hasOptimisation

  const goalInstructions = [
    hasRehab ? '- REHAB: include 3 strengthSessions targeting the injured area' : '- No rehab: strengthSessions = []',
    hasPrevention ? '- PREVENTION already selected by runner' : '',
    hasOptimisation ? '- OPTIMISATION already selected by runner' : '',
    rehabOnly ? '- Runner originally selected REHAB ONLY — if progression criteria are met, you may introduce prevention by adding it to both runnerGoals and activePhases' : '',
    !hasRehab && hasPrevention && !hasOptimisation ? '- If prevention well-established and pain ≤ 2/10, you may introduce optimisation' : '',
  ].filter(Boolean).join('\n')

  const prompt = `Review this runner's week and generate their next plan. Decide whether to advance their journey.

RUNNER: ${firstName}, Age: ${age}, Experience: ${experienceLevel}, Weekly load: ${weeklyTrainingLoad}
Years running: ${yearsRunning ?? 'Unknown'} · Marathon PB: ${marathonPb ?? 'None'} · 5k PB: ${fiveKPb ?? 'None'}
Race goal: ${raceGoalText}
${hasRehab ? `Injured area: ${region}\nCurrent tolerance: ${currentTolerance}` : ''}
Tier: ${previousPlan?.runnerTier ?? 'Unknown'}

SELECTED GOALS: ${allGoals.join(', ')}
CURRENTLY ACTIVE PHASES: ${currentActivePhases.join(', ')}
(Only expand activePhases if progression criteria are met)

${goalInstructions}

PREVIOUS PLAN:
${summarisePreviousPlan(previousPlan ?? {})}

CHECK-IN DATA:
${summariseCheckIns(checkIns ?? [])}

MEDICAL UPDATES:
${updatesText}

Assess the data. Decide PROGRESS / HOLD / REGRESS for rehab sessions.
Decide whether to expand activePhases (add prevention or optimisation) based on the rules.
If a new phase is unlocked, set phaseUnlocked to that phase name and write a phaseUnlockedMessage explaining it.

Return JSON with EXACTLY this structure:
{
  "runnerTier": ${JSON.stringify(previousPlan?.runnerTier ?? 'intermediate')},
  "runnerGoals": ["rehab"] or expanded array if a new goal is being introduced this week,
  "activePhases": ["rehab"] or expanded array if criteria met,
  "phaseUnlocked": null or "prevention" or "optimisation",
  "phaseUnlockedMessage": null or "1-2 sentence message celebrating the unlock — if this is a newly offered goal (wasn't originally selected), explain that the coach is introducing it now based on their progress",
  "checkinFrequencyDays": ${previousPlan?.checkinFrequencyDays ?? 7},
  "phase": "Phase name — e.g. Progressive Loading — Week 2",
  "planGoal": "1 sentence goal for this week",
  "progressionDecision": "progress" | "hold" | "regress",
  "decisionReason": "1-2 sentences explaining why, referencing the data",
  "aiConfidence": "high" | "moderate" | "low",
  "runningAllowance": {
    "allowed": true | false,
    "guidance": "1-2 sentences",
    "protocol": ["step 1", "step 2", "step 3"]
  },
  "strengthSessions": [
    {
      "day": "Day 1",
      "focus": "session focus",
      "warmUp": ["step 1", "step 2"],
      "exercises": [
        {
          "name": "Exercise name",
          "sets": 3,
          "reps": "10 reps",
          "tempo": "2-1-2",
          "painRule": "Stop if pain > 3/10",
          "reason": "why this exercise",
          "instructions": ["step 1", "step 2", "step 3"]
        }
      ]
    }
  ],
  "preventionWork": [] or 4-6 items if prevention is active,
  "optimisationWork": [] or 4-6 items if optimisation is active,
  "mobilityRecovery": ["item 1", "item 2", "item 3"],
  "educationNotes": ["note 1", "note 2"],
  "progressionRules": ["rule 1", "rule 2"],
  "stopOrEscalateRules": ["rule 1", "rule 2"],
  "reviewInDays": 7,
  "warnings": []
}

If rehab is active: 3 strengthSessions with 3 exercises each targeting ${region ?? 'the injured area'}.
If rehab is not active: strengthSessions = [].
If prevention is active (in new activePhases): preventionWork = 4-6 prehab/stability exercises.
If optimisation is active: optimisationWork = 4-6 performance exercises.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 502 })
    }

    const result = await response.json()
    const text = result.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No valid JSON in Claude response' }, { status: 502 })
    }

    const plan = JSON.parse(jsonMatch[0])
    return NextResponse.json(plan)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[generate-next-plan] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
