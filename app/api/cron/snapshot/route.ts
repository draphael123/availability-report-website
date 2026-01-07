import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// This endpoint is called by Vercel Cron daily
// Configure in vercel.json

export async function GET(request: Request) {
  // Check if Vercel KV is configured
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ 
      error: 'Vercel KV not configured',
      message: 'This endpoint requires Vercel KV to store snapshots.'
    }, { status: 503 })
  }

  // Verify the request is from Vercel Cron (in production)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Dynamic imports to avoid build-time errors
    const { kv } = await import('@vercel/kv')
    const { fetchSheetData } = await import('@/lib/sheet-fetcher')
    const { parseSheetRows } = await import('@/lib/sheet-parser')

    // Fetch current data from Google Sheets
    const result = await fetchSheetData()
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Failed to fetch sheet data',
        details: result.error 
      }, { status: 500 })
    }

    // Parse the data
    const parsedData = parseSheetRows(result.rows)
    
    // Create snapshot
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const snapshot = {
      date: today,
      timestamp: new Date().toISOString(),
      headers: result.headers,
      rowCount: parsedData.length,
      data: parsedData.map(row => ({
        raw: row.raw,
        daysOut: row.daysOut,
        availabilityScore: row.availabilityScore,
        hasError: row.hasError,
        categoryType: row.categoryType,
      })),
      summary: {
        totalRows: parsedData.length,
        hrtCount: parsedData.filter(r => r.categoryType === 'HRT').length,
        trtCount: parsedData.filter(r => r.categoryType === 'TRT').length,
        providerCount: parsedData.filter(r => r.categoryType === 'Provider').length,
        errorCount: parsedData.filter(r => r.hasError).length,
        avgDaysOut: calculateAvgDaysOut(parsedData),
      }
    }

    // Store in Vercel KV
    // Key format: snapshot:YYYY-MM-DD
    await kv.set(`snapshot:${today}`, JSON.stringify(snapshot), {
      ex: 60 * 60 * 24 * 90, // Expire after 90 days
    })

    // Also maintain a list of all snapshot dates
    const existingDates = await kv.get<string[]>('snapshot:dates') || []
    if (!existingDates.includes(today)) {
      const updatedDates = [...existingDates, today].sort().slice(-90) // Keep last 90 days
      await kv.set('snapshot:dates', updatedDates)
    }

    // Store latest snapshot reference
    await kv.set('snapshot:latest', today)

    return NextResponse.json({
      success: true,
      date: today,
      rowCount: parsedData.length,
      summary: snapshot.summary,
    })
  } catch (error) {
    console.error('Snapshot error:', error)
    return NextResponse.json({ 
      error: 'Failed to create snapshot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function calculateAvgDaysOut(data: { daysOut: number | null }[]): number | null {
  const withDaysOut = data.filter(r => r.daysOut !== null)
  if (withDaysOut.length === 0) return null
  const sum = withDaysOut.reduce((acc, r) => acc + r.daysOut!, 0)
  return Math.round((sum / withDaysOut.length) * 10) / 10
}
