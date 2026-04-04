import { NextResponse } from 'next/server'

export const maxDuration = 30

const SYSTEM_PROMPT = `You are a clinical safety screening assistant for a running rehabilitation app.

Your job is to assess whether it is safe for a runner to self-manage their recovery using an app, or whether they need to see a clinician first.

RED flags — must refer to clinician (status: "red"):
- Severe pain at rest (pain > 8/10 with no activity)
- Neurological symptoms: numbness, tingling, weakness, foot drop
- Severe swelling, locking, or giving way of a joint
- Recent trauma with suspected fracture or dislocation
- Symptoms following a fall, accident, or direct impact
- Cauda equina symptoms (bowel/bladder changes with back pain)
- Chest pain, dizziness, or systemic symptoms alongside injury
- Told by a clinician to stop all activity and not yet cleared
- Cancer history with new musculoskeletal symptoms

AMBER flags — can proceed with caution, include monitoring rules (status: "amber"):
- Pain > 6/10 currently
- Symptoms lasting more than 3 months without improvement
- Previous surgery on the same area in the last 6 months
- Significant swelling or bruising
- Night pain disrupting sleep
- Multiple joints affected simultaneously
- Age > 50 with acute onset joint pain
- Taking blood thinners or immunosuppressants

GREEN — safe to self-manage with app guidance (status: "green"):
- Everything else

Return ONLY a valid JSON object. No markdown, no explanation.

{
  "status": "green" | "amber" | "red",
  "redFlags": ["flag 1", "flag 2"],
  "cautionFlags": ["flag 1", "flag 2"],
  "reasoningSummary": "1-2 sentence summary of assessment",
  "recommendedAction": "1 sentence on what to do"
}`

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

  const {
    region, onsetDate, hasDiagnosis, diagnosisName,
    painScoreWorst, painScoreCurrent, aggravatingFactors,
    currentTolerance, pastedNotes, age,
  } = body

  const diagnosisText = hasDiagnosis === 'yes' && diagnosisName
    ? `Confirmed diagnosis: ${diagnosisName}`
    : hasDiagnosis === 'not_sure'
    ? 'No confirmed diagnosis — suspected injury'
    : 'No diagnosis'

  const prompt = `Assess this runner's injury for self-management safety.

Age: ${age ?? 'Unknown'}
Injured area: ${region ?? 'Not specified'}
Onset: ${onsetDate ?? 'Unknown'}
${diagnosisText}
Worst pain (past 2 weeks): ${painScoreWorst ?? '?'}/10
Current pain: ${painScoreCurrent ?? '?'}/10
Aggravating factors: ${Array.isArray(aggravatingFactors) && aggravatingFactors.length ? aggravatingFactors.join(', ') : 'None reported'}
Current activity tolerance: ${currentTolerance ?? 'Unknown'}
Clinical notes: ${pastedNotes || 'None provided'}

Assess for red flags, amber flags, or green (safe to self-manage). Return JSON only.`

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
        max_tokens: 512,
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
      return NextResponse.json({ error: 'No valid JSON in response' }, { status: 502 })
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[safety-check] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
