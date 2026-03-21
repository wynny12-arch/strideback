import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are an expert musculoskeletal physiotherapist specialising in running injury rehabilitation.
You generate personalised, evidence-based weekly rehab plans for injured runners.

Your plans must be:
- Clinically appropriate for the specific injury, pain level, and activity tolerance described
- Structured with 3 sessions per week on non-consecutive days (Day 1, Day 3, Day 5)
- Progressive but cautious — start conservatively, especially for higher pain scores
- Written in plain English the user can follow at home without equipment
- Specific about sets, reps, tempo, and pain thresholds

Pain rules:
- Pain ≤ 3/10 during exercise = acceptable
- Pain 4/10 = stop the set, reduce load
- Pain > 4/10 = stop the exercise entirely
- Next-morning stiffness > 5/10 = reduce load at next session

Running allowance: only allow running if current pain score ≤ 4/10 AND current tolerance is "can_jog" or "can_run".
If pain score is > 6/10 or tolerance is "cannot_walk" or "can_walk", set allowed to false.

Return ONLY a single valid JSON object. No markdown, no explanation, no code fences — raw JSON only.`

function buildPrompt(data: Record<string, unknown>): string {
  const {
    firstName, age, experienceLevel, weeklyTrainingLoad, mainGoal,
    otherActivities, region, onsetDate, hasDiagnosis, diagnosisName,
    painScoreWorst, painScoreCurrent, aggravatingFactors, currentTolerance,
    pastedNotes, medicalUpdates,
  } = data

  const diagnosisText = hasDiagnosis === 'yes' && diagnosisName
    ? `Confirmed diagnosis: ${diagnosisName}`
    : hasDiagnosis === 'not_sure'
    ? 'No confirmed diagnosis — suspected injury based on symptoms'
    : 'No diagnosis'

  const updatesText = Array.isArray(medicalUpdates) && medicalUpdates.length > 0
    ? medicalUpdates.map((u: Record<string, string>) => `[${u.type}] ${u.text}`).join('\n')
    : 'None'

  return `Generate a personalised 1-week running rehabilitation plan for this patient.

PATIENT PROFILE:
- Name: ${firstName}, Age: ${age}
- Running experience: ${experienceLevel}
- Current weekly training load: ${weeklyTrainingLoad}
- Main goal: ${mainGoal}
- Other training: ${Array.isArray(otherActivities) && otherActivities.length > 0 ? otherActivities.join(', ') : 'None'}

INJURY DETAILS:
- Injured area: ${region}
- Onset: ${onsetDate}
- ${diagnosisText}
- Worst pain in past 2 weeks: ${painScoreWorst}/10
- Current pain level: ${painScoreCurrent}/10
- Aggravating factors: ${Array.isArray(aggravatingFactors) ? aggravatingFactors.join(', ') : 'None reported'}
- Current activity tolerance: ${currentTolerance}

CLINICAL NOTES:
${pastedNotes || 'None provided'}

MEDICAL UPDATES SINCE ONBOARDING:
${updatesText}

Return a JSON object with EXACTLY this structure (all fields required):
{
  "phase": "Phase name — e.g. Load Management — Weeks 1–2",
  "planGoal": "2-3 sentence description of this week's rehabilitation goal",
  "aiConfidence": "high" | "moderate" | "low",
  "runningAllowance": {
    "allowed": true | false,
    "guidance": "1-2 sentences on running guidance this week",
    "protocol": ["step 1", "step 2", "step 3", "step 4", "step 5"]
  },
  "strengthSessions": [
    {
      "day": "Day 1",
      "focus": "Short description of this session's focus",
      "warmUp": ["warm-up step 1", "warm-up step 2", "warm-up step 3", "warm-up step 4"],
      "exercises": [
        {
          "name": "Exercise name",
          "sets": 3,
          "reps": "e.g. 10 reps or 5 × 45-second holds",
          "tempo": "e.g. 2 seconds up, 1 second hold, 2 seconds down",
          "painRule": "Specific pain threshold instruction for this exercise",
          "reason": "1 sentence explaining why this exercise is included",
          "instructions": ["step 1", "step 2", "step 3", "step 4", "step 5"]
        }
      ]
    },
    { "day": "Day 3", ... },
    { "day": "Day 5", ... }
  ],
  "mobilityRecovery": ["item 1", "item 2", "item 3", "item 4"],
  "educationNotes": ["note 1", "note 2", "note 3"],
  "progressionRules": ["rule 1", "rule 2", "rule 3"],
  "stopOrEscalateRules": ["rule 1", "rule 2", "rule 3"],
  "reviewInDays": 7,
  "warnings": ["warning 1", "warning 2"]
}

Include 3 exercises per session. Each session must have a warmUp array and an exercises array.`
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

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(body) }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 502 })
    }

    const result = await response.json()
    const text = result.content?.[0]?.text ?? ''

    // Extract JSON — strip any accidental markdown fences
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No valid JSON in Claude response' }, { status: 502 })
    }

    const plan = JSON.parse(jsonMatch[0])
    return NextResponse.json(plan)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
