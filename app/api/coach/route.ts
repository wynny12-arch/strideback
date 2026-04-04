import { NextResponse } from 'next/server'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are StrideBack Coach — an expert sports physiotherapist and running coach. You have full context about this runner: their profile, tier, goals, current plan, recent check-ins, and activity log. Your job is to answer their questions, offer encouragement, and give personalised, evidence-based guidance.

Be warm, direct, and concise. You are texting a runner, not writing an essay.

Rules:
- Never diagnose conditions you haven't been told about
- If they describe new or worsening symptoms, advise them to seek professional assessment
- Always reference their actual plan, tier, and goals when giving advice
- Keep responses to 2–4 short paragraphs max unless they ask for detail
- Use plain English, no jargon`

interface CoachRequestBody {
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  context: {
    profile?: Record<string, unknown>
    plan?: Record<string, unknown>
    recentCheckins?: Record<string, unknown>[]
    activityLog?: Record<string, unknown>[]
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  let body: CoachRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { message, history, context } = body

  // Build context block for the system prompt
  const contextParts: string[] = []

  if (context.profile) {
    const p = context.profile
    contextParts.push(`RUNNER PROFILE:
- Name: ${p.firstName ?? 'Unknown'}
- Age: ${p.age ?? 'Unknown'}
- Tier: ${p.runnerTier ?? 'Unknown'}
- Goals: ${Array.isArray(p.goals) ? (p.goals as string[]).join(', ') : 'Unknown'}
- Years running: ${p.yearsRunning ?? 'Unknown'}
- Marathon PB: ${p.marathonPb ?? 'None'}
- 5k PB: ${p.fiveKPb ?? 'None'}
- Weekly load: ${p.weeklyTrainingLoad ?? 'Unknown'}`)
  }

  if (context.plan) {
    const pl = context.plan
    const runningAllowance = pl.runningAllowance as Record<string, unknown> | undefined

    const formatExercise = (e: Record<string, unknown>) =>
      `  - ${e.name}: ${e.sets} sets × ${e.reps}${e.tempo ? `, tempo ${e.tempo}` : ''}${e.painRule ? `, pain rule: ${e.painRule}` : ''}${e.instructions ? `\n    How to do it: ${(e.instructions as string[]).join(' → ')}` : ''}`

    const sessions = Array.isArray(pl.strengthSessions) ? pl.strengthSessions as Record<string, unknown>[] : []
    const rehabSection = sessions.length > 0
      ? `\nREHAB SESSIONS:\n${sessions.map((s: Record<string, unknown>) => {
          const exList = (Array.isArray(s.exercises) ? s.exercises as Record<string, unknown>[] : []).map(formatExercise).join('\n')
          return `${s.day} — ${s.focus}:\n${exList}`
        }).join('\n')}`
      : ''

    const prevWork = Array.isArray(pl.preventionWork) ? pl.preventionWork as string[] : []
    const prevSection = prevWork.length > 0
      ? `\nPREVENTION EXERCISES:\n${prevWork.map((item, i) => `  ${i + 1}. ${item}`).join('\n')}`
      : ''

    const optWork = Array.isArray(pl.optimisationWork) ? pl.optimisationWork as string[] : []
    const optSection = optWork.length > 0
      ? `\nPERFORMANCE EXERCISES:\n${optWork.map((item, i) => `  ${i + 1}. ${item}`).join('\n')}`
      : ''

    contextParts.push(`CURRENT PLAN:
- Phase: ${pl.phase ?? 'Unknown'}
- Goal: ${pl.planGoal ?? 'Unknown'}
- Tier: ${pl.runnerTier ?? 'Unknown'}
- Active phases: ${Array.isArray(pl.activePhases) ? (pl.activePhases as string[]).join(', ') : 'Unknown'}
- Check-in frequency: every ${pl.checkinFrequencyDays ?? 7} days
- Running allowed: ${runningAllowance?.allowed ? 'Yes' : 'No'}
- Running guidance: ${runningAllowance?.guidance ?? 'N/A'}${rehabSection}${prevSection}${optSection}`)
  }

  if (context.recentCheckins && context.recentCheckins.length > 0) {
    const checkins = context.recentCheckins.slice(0, 3)
    contextParts.push(`RECENT CHECK-INS (last ${checkins.length}):
${checkins.map((c, i) => `${i + 1}. Pain before/during/after: ${c.painBefore}/${c.painDuring}/${c.painAfter}, next-day stiffness: ${c.nextDayStiffness}, confidence: ${c.confidenceScore}/4${c.freeTextNotes ? `, notes: "${c.freeTextNotes}"` : ''}`).join('\n')}`)
  }

  if (context.activityLog && context.activityLog.length > 0) {
    const recent = context.activityLog.slice(0, 5)
    contextParts.push(`RECENT ACTIVITIES (last ${recent.length}):
${recent.map((a) => `- ${a.date}: ${a.type}${a.distanceValue ? ` ${a.distanceValue}${a.distanceUnit}` : ''}${a.durationMins ? ` ${a.durationMins}min` : ''}, feel: ${a.feel}/10${a.notes ? `, notes: "${a.notes}"` : ''}`).join('\n')}`)
  }

  const systemWithContext = contextParts.length > 0
    ? `${SYSTEM_PROMPT}\n\n---\n\n${contextParts.join('\n\n')}`
    : SYSTEM_PROMPT

  // Build messages array
  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user' as const, content: message },
  ]

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemWithContext,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 502 })
    }

    const result = await response.json()
    const reply = result.content?.[0]?.text ?? ''
    return NextResponse.json({ reply })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[coach] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
