import { NextResponse } from 'next/server'
import { fetchSheetData } from '@/lib/sheet-fetcher'
import { parseSheetRows } from '@/lib/sheet-parser'
import { SheetDataResponse } from '@/lib/types'

// Cache to reduce API calls
let cachedData: SheetDataResponse | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60 * 1000 // 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forceRefresh = searchParams.get('refresh') === 'true'
  
  const now = Date.now()
  
  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_TTL) {
    return NextResponse.json(cachedData)
  }
  
  try {
    const result = await fetchSheetData()
    
    if (!result.success) {
      const errorResponse: SheetDataResponse = {
        success: false,
        data: [],
        headers: [],
        fetchedAt: new Date().toISOString(),
        source: result.source,
        error: result.error,
        troubleshooting: result.troubleshooting,
      }
      
      return NextResponse.json(errorResponse, { status: 500 })
    }
    
    const parsedData = parseSheetRows(result.rows)
    
    const response: SheetDataResponse = {
      success: true,
      data: parsedData,
      headers: result.headers,
      fetchedAt: new Date().toISOString(),
      source: result.source,
    }
    
    // Update cache
    cachedData = response
    cacheTimestamp = now
    
    return NextResponse.json(response)
  } catch (error) {
    const errorResponse: SheetDataResponse = {
      success: false,
      data: [],
      headers: [],
      fetchedAt: new Date().toISOString(),
      source: 'api',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      troubleshooting: [
        'Check the server logs for more details',
        'Verify your environment variables are set correctly',
        'Ensure the Google Sheet is accessible',
      ],
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

