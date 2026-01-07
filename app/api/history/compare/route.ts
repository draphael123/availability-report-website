import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { HistoricalSnapshot } from '../route'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'day' // 'day', 'week', 'month'

  try {
    const allDates = await kv.get<string[]>('snapshot:dates') || []
    
    if (allDates.length === 0) {
      return NextResponse.json({
        hasHistory: false,
        message: 'No historical data available yet. Snapshots are taken daily.',
      })
    }

    const today = new Date().toISOString().split('T')[0]
    const sortedDates = [...allDates].sort().reverse()
    
    // Get the most recent snapshot
    const latestDate = sortedDates[0]
    const latestSnapshot = await kv.get<string>(`snapshot:${latestDate}`)
    
    if (!latestSnapshot) {
      return NextResponse.json({ 
        hasHistory: false,
        message: 'No snapshot data found' 
      })
    }

    const latest: HistoricalSnapshot = JSON.parse(latestSnapshot)

    // Calculate comparison date based on period
    let compareDate: string | null = null
    const latestDateObj = new Date(latestDate)
    
    if (period === 'day') {
      // Yesterday
      const yesterday = new Date(latestDateObj)
      yesterday.setDate(yesterday.getDate() - 1)
      compareDate = yesterday.toISOString().split('T')[0]
    } else if (period === 'week') {
      // 7 days ago
      const weekAgo = new Date(latestDateObj)
      weekAgo.setDate(weekAgo.getDate() - 7)
      compareDate = weekAgo.toISOString().split('T')[0]
    } else if (period === 'month') {
      // 30 days ago
      const monthAgo = new Date(latestDateObj)
      monthAgo.setDate(monthAgo.getDate() - 30)
      compareDate = monthAgo.toISOString().split('T')[0]
    }

    // Find the closest available date if exact date doesn't exist
    let previousSnapshot: HistoricalSnapshot | null = null
    if (compareDate && allDates.includes(compareDate)) {
      const prevData = await kv.get<string>(`snapshot:${compareDate}`)
      if (prevData) {
        previousSnapshot = JSON.parse(prevData)
      }
    } else if (compareDate) {
      // Find closest earlier date
      const earlierDates = sortedDates.filter(d => d < latestDate)
      if (earlierDates.length > 0) {
        const closestDate = earlierDates[0]
        const prevData = await kv.get<string>(`snapshot:${closestDate}`)
        if (prevData) {
          previousSnapshot = JSON.parse(prevData)
          compareDate = closestDate
        }
      }
    }

    // Calculate changes
    const current = latest.summary
    const previous = previousSnapshot?.summary
    
    const changes = previous ? {
      totalRows: current.totalRows - previous.totalRows,
      totalRowsPercent: previous.totalRows > 0 
        ? Math.round(((current.totalRows - previous.totalRows) / previous.totalRows) * 100 * 10) / 10
        : null,
      hrtCount: current.hrtCount - previous.hrtCount,
      trtCount: current.trtCount - previous.trtCount,
      providerCount: current.providerCount - previous.providerCount,
      errorCount: current.errorCount - previous.errorCount,
      avgDaysOut: current.avgDaysOut !== null && previous.avgDaysOut !== null
        ? Math.round((current.avgDaysOut - previous.avgDaysOut) * 10) / 10
        : null,
      errorRate: calculateErrorRateChange(current, previous),
    } : null

    return NextResponse.json({
      hasHistory: true,
      period,
      current: {
        date: latestDate,
        summary: current,
      },
      previous: previousSnapshot ? {
        date: compareDate,
        summary: previous,
      } : null,
      changes,
      availableDates: allDates.length,
      oldestDate: sortedDates[sortedDates.length - 1],
      newestDate: sortedDates[0],
    })
  } catch (error) {
    console.error('Compare error:', error)
    return NextResponse.json({ 
      error: 'Failed to compare history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function calculateErrorRateChange(
  current: HistoricalSnapshot['summary'], 
  previous: HistoricalSnapshot['summary']
): number | null {
  const currentRate = current.totalRows > 0 
    ? (current.errorCount / current.totalRows) * 100 
    : 0
  const previousRate = previous.totalRows > 0 
    ? (previous.errorCount / previous.totalRows) * 100 
    : 0
  return Math.round((currentRate - previousRate) * 10) / 10
}

