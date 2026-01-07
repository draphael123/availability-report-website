import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export interface HistoricalSnapshot {
  date: string
  timestamp: string
  headers: string[]
  rowCount: number
  data: {
    raw: Record<string, string>
    daysOut: number | null
    availabilityScore: number | null
    hasError: boolean
    categoryType: string
  }[]
  summary: {
    totalRows: number
    hrtCount: number
    trtCount: number
    providerCount: number
    errorCount: number
    avgDaysOut: number | null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const range = searchParams.get('range') // 'week', 'month', 'all'

  try {
    // Get specific date
    if (date) {
      const snapshot = await kv.get<string>(`snapshot:${date}`)
      if (!snapshot) {
        return NextResponse.json({ 
          error: 'Snapshot not found for this date' 
        }, { status: 404 })
      }
      return NextResponse.json(JSON.parse(snapshot))
    }

    // Get available dates
    const allDates = await kv.get<string[]>('snapshot:dates') || []
    
    if (range === 'all') {
      // Return just the list of available dates
      return NextResponse.json({ dates: allDates })
    }

    // Get summaries for requested range
    let datesToFetch: string[] = []
    const today = new Date()
    
    if (range === 'week') {
      // Last 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        datesToFetch.push(d.toISOString().split('T')[0])
      }
    } else if (range === 'month') {
      // Last 30 days
      for (let i = 0; i < 30; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        datesToFetch.push(d.toISOString().split('T')[0])
      }
    } else {
      // Default: last 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        datesToFetch.push(d.toISOString().split('T')[0])
      }
    }

    // Filter to only dates that exist
    datesToFetch = datesToFetch.filter(d => allDates.includes(d))

    // Fetch summaries for each date
    const summaries = await Promise.all(
      datesToFetch.map(async (d) => {
        const snapshot = await kv.get<string>(`snapshot:${d}`)
        if (!snapshot) return null
        const parsed: HistoricalSnapshot = JSON.parse(snapshot)
        return {
          date: d,
          summary: parsed.summary,
        }
      })
    )

    // Filter out nulls and sort by date
    const validSummaries = summaries
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      range,
      availableDates: allDates,
      summaries: validSummaries,
    })
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

