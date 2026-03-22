import { NextResponse } from 'next/server'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are an expert musculoskeletal physiotherapist specialising in running injury rehabilitation.
You review a patient's completed week of rehab and generate their next personalised weekly plan.

Your decision must be based strictly on the check-in data provided:
- PROGRESS load if: pain during exercise averaged ≤ 3/10, next-morning stiffness averaged ≤ 4/10, and confidence was "Felt good" or "Easy" on majority of sessions
- HOLD at current load if: pain averaged 3–5/10, or stiffness averaged 4–6/10, or confidence was mostly "Managed"
- REGRESS load if: pain averaged > 5/10, stiffness averaged > 6/10, or confidence was mostly "Struggled", or fewer than 2 sessions completed

Progression rules:
- Progress: increase sets by 1 OR increase reps by 2 OR slow tempo by 1 second — not all three at once
- Hold: same exercises, same load, different session ordering or warmup variation
- Regress: reduce sets by 1 OR reduce reps by 2 OR reduce tempo demand

EVERY exercise in EVERY session must directly target or rehabilitate the injured area stated. Do not include exercises for unrelated body regions.

Pain rules:
- Pain ≤ 3/10 during exercise = acceptable
- Pain 4/10 = stop the set, reduce load
- Pain > 4/10 = stop the exercise entirely
- Next-morning stiffness > 5/10 = reduce load at next session

Running allowance: only allow running if current pain score ≤ 4/10 AND current tolerance is "can_jog" or "can_run".

Keep ALL string values concise — 15 words or fewer. Arrays should contain the minimum items specified, no more.

Return ONLY a single valid JSON object. No markdown, no explanation, no code fences — raw JSON only.`

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

  return `Sessions completed: ${checkIns.length}/3
Average pain before: ${avg('painBefore')}/10
Average pain during: ${avg('painDuring')}/10
Average pain after: ${avg('painAfter')}/10
Average next-morning stiffness: ${avg('nextDayStiffness')}/10
Confidence per session: ${confSummary}
${notes ? `Patient notes: ${notes}` : ''}`
}

function summarisePreviousPlan(plan: Record<string, unknown>): string {
  const sessions = Array.isArray(plan.strengthSessions) ? plan.strengthSessions : []
  const exerciseSummary = sessions.map((s: Record<string, unknown>, i: number) => {
    const exercises = Array.isArray(s.exercises) ? s.exercises : []
    const exList = exercises.map((e: Record<string, unknown>) =>
      `${e.name} — ${e.sets} sets × ${e.reps}, tempo: ${e.tempo}`
    ).join('; ')
    return `Day ${i + 1}: ${exList}`
  }).join('\n')

  return `Phase: ${plan.phase}
Goal: ${plan.planGoal}
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

  const { region, firstName, age, experienceLevel, mainGoal, currentTolerance, targetEvent, targetEventDate } = onboarding ?? {}

  const updatesText = Array.isArray(medicalUpdates) && medicalUpdates.length > 0
    ? medicalUpdates.map(u => `[${u.type}] ${u.text}`).join('\n')
    : 'None'

  const prompt = `Review this patient's completed week and generate their next personalised rehabilitation plan.

PATIENT: ${firstName}, Age: ${age}, Experience: ${experienceLevel}, Goal: ${mainGoal}
INJURED AREA (all exercises must target this): ${region}
CURRENT TOLERANCE: ${currentTolerance}
TARGET EVENT: ${targetEvent ? `${targetEvent}${targetEventDate ? ` on ${targetEventDate}` : ''}` : 'None'}

PREVIOUS WEEK'S PLAN:
${summarisePreviousPlan(previousPlan ?? {})}

THIS WEEK'S CHECK-IN DATA:
${summariseCheckIns(checkIns ?? [])}

MEDICAL UPDATES:
${updatesText}

Based on the check-in data, decide whether to PROGRESS, HOLD, or REGRESS the plan. Explain your decision clearly in the decisionReason field.

Return a JSON object with EXACTLY this structure (all fields required):
{
  "phase": "Phase name — e.g. Progressive Loading — Week 2",
  "planGoal": "1 sentence describing this week's rehabilitation goal",
  "progressionDecision": "progress" | "hold" | "regress",
  "decisionReason": "1-2 sentences explaining why based on the check-in data",
  "aiConfidence": "high" | "moderate" | "low",
  "runningAllowance": {
    "allowed": true | false,
    "guidance": "1-2 sentences on running guidance this week",
    "protocol": ["step 1", "step 2", "step 3"]
  },
  "strengthSessions": [
    {
      "day": "Day 1",
      "focus": "Short description of this session's focus",
      "warmUp": ["warm-up step 1", "warm-up step 2"],
      "exercises": [
        {
          "name": "Exercise name",
          "sets": 3,
          "reps": "e.g. 10 reps or 5 × 45-second holds",
          "tempo": "e.g. 2 seconds up, 1 second hold, 2 seconds down",
          "painRule": "Specific pain threshold instruction for this exercise",
          "reason": "1 sentence explaining why this exercise is included",
          "instructions": ["step 1", "step 2", "step 3", "step 4"]
        }
      ]
    },
    { "day": "Day 3", "focus": "...", "warmUp": [...], "exercises": [...] },
    { "day": "Day 5", "focus": "...", "warmUp": [...], "exercises": [...] }
  ],
  "mobilityRecovery": ["item 1", "item 2", "item 3"],
  "educationNotes": ["note 1", "note 2"],
  "progressionRules": ["rule 1", "rule 2"],
  "stopOrEscalateRules": ["rule 1", "rule 2"],
  "reviewInDays": 7,
  "warnings": ["warning 1"]
}

Include 3 exercises per session.`

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
