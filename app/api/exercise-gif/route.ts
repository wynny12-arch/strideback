import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json({ gifUrl: null })

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return NextResponse.json({ gifUrl: null })

  try {
    const slug = encodeURIComponent(name.toLowerCase())
    const url = `https://exercisedb.p.rapidapi.com/exercises/name/${slug}?limit=1&offset=0`
    const res = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[exercise-gif] API error', res.status, errText)
      return NextResponse.json({ gifUrl: null })
    }

    const data = await res.json()
    const first = data?.[0]
    console.log('[exercise-gif]', name, '→', data?.length, 'results, first:', first?.name, 'id:', first?.id)
    if (!first?.id) return NextResponse.json({ gifUrl: null })
    // New API version removed gifUrl — construct from id
    const gifUrl = `https://v2.exercisedb.io/image/${first.id}.gif`
    return NextResponse.json({ gifUrl })
  } catch (e) {
    console.error('[exercise-gif] fetch failed:', e)
    return NextResponse.json({ gifUrl: null })
  }
}
