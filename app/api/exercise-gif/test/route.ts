import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.RAPIDAPI_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'RAPIDAPI_KEY not set' })
  }

  try {
    const res = await fetch(
      'https://exercisedb.p.rapidapi.com/exercises/name/calf%20raise?limit=1&offset=0',
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
        },
      }
    )

    const text = await res.text()
    return NextResponse.json({
      status: res.status,
      keyPrefix: apiKey.slice(0, 8) + '...',
      body: text.slice(0, 500),
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
