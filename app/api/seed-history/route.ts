import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { fetchSheetData } from '@/lib/sheet-fetcher'
import { parseSheetRows } from '@/lib/sheet-parser'

// This endpoint seeds historical data for the last 30 days
// based on the current data with slight variations

export async function GET(request: Request) {
  try {
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
    
    const today = new Date()
    const seededDates: string[] = []
    
    // Generate snapshots for the last 30 days
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      // Add some variation to make it look realistic
      const variationFactor = 0.9 + (Math.random() * 0.2) // 90% to 110%
      const errorVariation = Math.random() * 0.05 // 0% to 5% additional errors
      
      // Create snapshot with slight variations
      const snapshotData = parsedData.map(row => {
        // Vary days out slightly
        let variedDaysOut = row.daysOut
        if (variedDaysOut !== null) {
          const dayVariation = Math.floor((Math.random() - 0.5) * 6) // -3 to +3 days
          variedDaysOut = Math.max(0, variedDaysOut + dayVariation)
        }
        
        // Randomly add/remove some errors for variation
        const hasError = row.hasError || (Math.random() < errorVariation)
        
        return {
          raw: row.raw,
          daysOut: variedDaysOut,
          availabilityScore: row.availabilityScore,
          hasError,
          categoryType: row.categoryType,
        }
      })
      
      // Calculate summary stats
      const totalRows = snapshotData.length
      const hrtCount = snapshotData.filter(r => r.categoryType === 'HRT').length
      const trtCount = snapshotData.filter(r => r.categoryType === 'TRT').length
      const providerCount = snapshotData.filter(r => r.categoryType === 'Provider').length
      const errorCount = snapshotData.filter(r => r.hasError).length
      
      const rowsWithDaysOut = snapshotData.filter(r => r.daysOut !== null)
      const avgDaysOut = rowsWithDaysOut.length > 0
        ? Math.round((rowsWithDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / rowsWithDaysOut.length) * 10) / 10
        : null

      const snapshot = {
        date: dateStr,
        timestamp: date.toISOString(),
        headers: result.headers,
        rowCount: totalRows,
        data: snapshotData,
        summary: {
          totalRows,
          hrtCount,
          trtCount,
          providerCount,
          errorCount,
          avgDaysOut,
        }
      }

      // Store in Vercel KV
      await kv.set(`snapshot:${dateStr}`, JSON.stringify(snapshot), {
        ex: 60 * 60 * 24 * 90, // Expire after 90 days
      })
      
      seededDates.push(dateStr)
    }

    // Update the list of available dates
    const existingDates = await kv.get<string[]>('snapshot:dates') || []
    const allDates = [...new Set([...existingDates, ...seededDates])].sort()
    await kv.set('snapshot:dates', allDates)

    // Set latest snapshot reference
    const latestDate = seededDates[seededDates.length - 1]
    await kv.set('snapshot:latest', latestDate)

    return NextResponse.json({
      success: true,
      message: `Seeded ${seededDates.length} days of historical data`,
      dates: seededDates,
      summary: {
        totalDays: seededDates.length,
        from: seededDates[0],
        to: latestDate,
      }
    })
  } catch (error) {
    console.error('Seed history error:', error)
    return NextResponse.json({ 
      error: 'Failed to seed history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

