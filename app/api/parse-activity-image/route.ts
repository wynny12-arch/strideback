import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  let body: { imageDataUrl: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { imageDataUrl } = body
  if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
    return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
  }

  // Parse the data URL: data:<mediaType>;base64,<data>
  const commaIdx = imageDataUrl.indexOf(',')
  const meta = imageDataUrl.slice(5, commaIdx) // e.g. "image/jpeg;base64"
  const mediaType = meta.split(';')[0] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  const base64Data = imageDataUrl.slice(commaIdx + 1)

  const prompt = `This is a screenshot from a fitness or running app (e.g. Strava, Garmin, Apple Fitness, Nike Run Club).

Extract the following activity data from the screenshot. Return ONLY a JSON object — no markdown, no explanation.

{
  "activityType": "run" | "cycle" | "swim" | "gym" | "walk" | "other",
  "durationMins": number or null,
  "distanceValue": "string e.g. 5.2" or null,
  "distanceUnit": "miles" | "km" | null,
  "pace": "string e.g. 7:30" or null,
  "avgHeartRate": number or null
}

Rules:
- activityType: infer from context clues (running icon, pace format, swim laps, etc.)
- durationMins: convert to minutes if shown as h:mm or mm:ss format
- distanceValue: the numeric value as a string, no units
- distanceUnit: look for "mi", "miles", "km", "k" — if ambiguous, use "km"
- pace: format as "M:SS" (e.g. "7:30") — omit /mi or /km suffix
- avgHeartRate: in bpm, number only
- If a field is not visible or not applicable, set it to null`

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
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
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

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[parse-activity-image] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
