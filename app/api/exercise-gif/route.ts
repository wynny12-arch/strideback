import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json({ gifUrl: null })

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return NextResponse.json({ gifUrl: null })

  async function searchExercise(searchName: string): Promise<string | null> {
    const slug = encodeURIComponent(searchName.toLowerCase())
    const res = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${slug}?limit=1&offset=0`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey!,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const id = data?.[0]?.id
    if (!id) return null
    return `https://v2.exercisedb.io/image/${id}`
  }

  try {
    // Try full name first, then first two words as fallback
    let gifUrl = await searchExercise(name)

    if (!gifUrl) {
      const shortName = name.split(' ').slice(0, 2).join(' ')
      if (shortName !== name) {
        gifUrl = await searchExercise(shortName)
      }
    }

    console.log('[exercise-gif]', name, '→', gifUrl ? 'found' : 'not found')
    return NextResponse.json({ gifUrl })
  } catch (e) {
    console.error('[exercise-gif] fetch failed:', e)
    return NextResponse.json({ gifUrl: null })
  }
}
