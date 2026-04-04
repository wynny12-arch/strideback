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

    const data = await res.json()
    const first = data?.[0] ?? null
    return NextResponse.json({
      status: res.status,
      keyPrefix: apiKey.slice(0, 8) + '...',
      resultCount: data?.length,
      fields: first ? Object.keys(first) : [],
      gifUrl: first?.gifUrl ?? null,
      name: first?.name ?? null,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
