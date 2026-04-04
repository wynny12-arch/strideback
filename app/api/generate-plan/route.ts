import { NextResponse } from 'next/server'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are an expert sports physiotherapist and running coach who specialises in injury rehabilitation, injury prevention, and running performance optimisation.

You generate personalised, evidence-based weekly plans for runners. The plan must address ALL of the runner's selected goals.

RUNNER TIER INFERENCE:
Infer the runner's tier from their profile signals:
- novice: < 1 year running, no race PBs, beginner experience
- intermediate: 1–3 years running, occasional races, moderate experience
- advanced: 3–7+ years, competitive experience, sub-20 5k or sub-3:45 marathon
- semi_elite: 7+ years, marathon PB < 3:00:00 or 5k PB < 17:00, high weekly load

Set checkinFrequencyDays based on tier:
- novice: 7 (weekly)
- intermediate: 3–4
- advanced: 2–3
- semi_elite: 1 (daily)

GOALS:
The plan must address each selected goal:
- rehab: 3 strength sessions targeting the injured region, running allowance guidance
- prevention: include preventionWork — 4–6 prehab/stability exercises to stay injury-free (do NOT duplicate rehab exercises)
- optimisation: include optimisationWork — 4–6 performance exercises to improve running economy, power, speed (do NOT duplicate other sections)

Pain rules (apply to rehab sessions only):
- Pain ≤ 3/10 during exercise = acceptable
- Pain 4/10 = stop the set, reduce load
- Pain > 4/10 = stop the exercise entirely
- Next-morning stiffness > 5/10 = reduce load at next session

Running allowance (rehab goal): only allow running if current pain ≤ 4/10 AND tolerance is "can_jog" or "can_run". If pain > 6/10 or tolerance is "cannot_walk"/"can_walk", set allowed to false.
Non-rehab goals: set runningAllowance.allowed to true with guidance appropriate to tier/goals.

PREVENTION + OPTIMISATION SEQUENCING (when both selected without rehab):
- novice: preventionWork must be foundational stability exercises (glute activation, single-leg balance, hip stability, ankle stability). optimisationWork should be introductory and lighter (2–3 items max this week). Add an educationNote that performance work will build progressively over coming weeks as the stability base develops.
- intermediate/advanced/semi_elite: include full preventionWork and optimisationWork concurrently at appropriate intensity for the tier. No sequencing needed — both run together from week 1.

Keep ALL string values concise — 15 words or fewer. Arrays should contain the minimum items specified.

Return ONLY a single valid JSON object. No markdown, no explanation, no code fences — raw JSON only.`

function buildPrompt(data: Record<string, unknown>): string {
  const {
    firstName, age, experienceLevel, weeklyTrainingLoad,
    otherActivities, trainingPlan, weeklyMileage, distanceUnit,
    longestRecentRun, surfaces, surface, typicalPace,
    goals, yearsRunning, marathonPb, fiveKPb, raceGoal,
    region, onsetDate, hasDiagnosis, diagnosisName,
    painScoreWorst, painScoreCurrent, aggravatingFactors, currentTolerance,
    pastedNotes, medicalUpdates,
  } = data

  const goalsArr = Array.isArray(goals) ? goals as string[] : []
  const hasRehab = goalsArr.includes('rehab')
  const hasPrevention = goalsArr.includes('prevention')
  const hasOptimisation = goalsArr.includes('optimisation')

  const diagnosisText = hasDiagnosis === 'yes' && diagnosisName
    ? `Confirmed diagnosis: ${diagnosisName}`
    : hasDiagnosis === 'not_sure'
    ? 'No confirmed diagnosis — suspected injury based on symptoms'
    : 'No diagnosis'

  const updatesText = Array.isArray(medicalUpdates) && medicalUpdates.length > 0
    ? medicalUpdates.map((u: Record<string, string>) => `[${u.type}] ${u.text}`).join('\n')
    : 'None'

  const raceGoalObj = raceGoal as Record<string, string | null> | null
  const raceGoalText = raceGoalObj?.distance
    ? `${raceGoalObj.distance}${raceGoalObj.eventName ? ` — ${raceGoalObj.eventName}` : ''}${raceGoalObj.date ? ` on ${raceGoalObj.date}` : ''}${raceGoalObj.goalTime ? `, goal time: ${raceGoalObj.goalTime}` : ''}`
    : 'None'

  const injurySection = hasRehab ? `
INJURY DETAILS (rehab sessions must target this region specifically):
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
${updatesText}` : ''

  const preventionNote = hasPrevention ? '\n- PREVENTION goal selected: include preventionWork array with 4–6 prehab/stability exercises.' : ''
  const optimisationNote = hasOptimisation ? '\n- OPTIMISATION goal selected: include optimisationWork array with 4–6 performance/strength exercises.' : ''
  const rehabNote = hasRehab ? '\n- REHAB goal selected: include 3 strengthSessions and runningAllowance.' : '\n- No rehab goal: set strengthSessions to [] and runningAllowance.allowed to true.'

  return `Generate a personalised 1-week running plan for this runner. Goals: ${goalsArr.join(', ')}.
${rehabNote}${preventionNote}${optimisationNote}

RUNNER PROFILE:
- Name: ${firstName}, Age: ${age}
- Years running: ${yearsRunning || 'Not provided'}
- Marathon PB: ${marathonPb || 'None / not applicable'}
- 5k PB: ${fiveKPb || 'None / not applicable'}
- Running experience: ${experienceLevel}
- Current weekly training load: ${weeklyTrainingLoad}
- Other training: ${Array.isArray(otherActivities) && otherActivities.length > 0 ? otherActivities.join(', ') : 'None'}
- Weekly distance: ${weeklyMileage ? `${weeklyMileage} ${distanceUnit ?? 'miles'}` : 'Not provided'}
- Longest recent run: ${longestRecentRun ? `${longestRecentRun} ${distanceUnit ?? 'miles'}` : 'Not provided'}
- Typical pace: ${typicalPace || 'Not provided'}
- Preferred surface: ${Array.isArray(surfaces) && surfaces.length ? surfaces.join(', ') : surface || 'Not provided'}
- Race goal: ${raceGoalText}
- Training plan: ${trainingPlan || 'None provided'}
${injurySection}

Return a JSON object with EXACTLY this structure (all fields required):
{
  "runnerTier": "novice" | "intermediate" | "advanced" | "semi_elite",
  "runnerGoals": ${JSON.stringify(goalsArr)},
  "checkinFrequencyDays": 7,
  "phase": "Phase name e.g. Load Management — Week 1",
  "planGoal": "1 sentence describing this week's goal",
  "aiConfidence": "high" | "moderate" | "low",
  "runningAllowance": {
    "allowed": true | false,
    "guidance": "1-2 sentences on running this week",
    "protocol": ["step 1", "step 2", "step 3"]
  },
  "strengthSessions": [
    {
      "day": "Day 1",
      "focus": "Short description of session focus",
      "warmUp": ["warm-up step 1", "warm-up step 2"],
      "exercises": [
        {
          "name": "Exercise name",
          "sets": 3,
          "reps": "10 reps",
          "tempo": "2-1-2",
          "painRule": "Stop if pain exceeds 3/10",
          "reason": "1 sentence why this exercise is included",
          "instructions": ["step 1", "step 2", "step 3"]
        }
      ]
    }
  ],
  "preventionWork": ["exercise 1", "exercise 2", "exercise 3", "exercise 4"],
  "optimisationWork": ["exercise 1", "exercise 2", "exercise 3", "exercise 4"],
  "mobilityRecovery": ["item 1", "item 2", "item 3"],
  "educationNotes": ["note 1", "note 2"],
  "progressionRules": ["rule 1", "rule 2"],
  "stopOrEscalateRules": ["rule 1", "rule 2"],
  "reviewInDays": 7,
  "warnings": ["warning 1"]
}

If rehab goal: include 3 strengthSessions (Day 1, Day 3, Day 5) with 3 exercises each targeting the injured area.
If no rehab goal: strengthSessions should be [].
If prevention goal: preventionWork must have 4–6 items. Otherwise set to [].
If optimisation goal: optimisationWork must have 4–6 items. Otherwise set to [].`
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
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

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No valid JSON in Claude response' }, { status: 502 })
    }

    const plan = JSON.parse(jsonMatch[0])

    // Set activePhases: rehab always starts first; prevention/optimisation unlock via weekly review
    const goalsInPlan: string[] = Array.isArray(plan.runnerGoals) ? plan.runnerGoals : []
    if (goalsInPlan.includes('rehab')) {
      plan.activePhases = ['rehab']
    } else {
      plan.activePhases = goalsInPlan // no rehab — all selected goals are active from day 1
    }

    return NextResponse.json(plan)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[generate-plan] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
