import { NextResponse } from 'next/server'
import { fetchSheetData } from '@/lib/sheet-fetcher'

export async function GET() {
  try {
    const result = await fetchSheetData()
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    
    // Return first 3 rows with all their data for debugging
    const sampleRows = result.rows.slice(0, 3)
    
    return NextResponse.json({
      headers: result.headers,
      sampleRows,
      totalRows: result.rows.length,
      columnNames: result.headers,
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}




