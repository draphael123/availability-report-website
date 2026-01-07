import { SheetRow } from './types'

const DEFAULT_SHEET_ID = '1vOXJEegJHJizatcXErv_dOLuWCiz_z8fGZasSDde2tc'
const DEFAULT_SHEET_GID = '766458838'

/**
 * Configuration for sheet fetching
 */
interface SheetConfig {
  sheetId: string
  gid: string
  apiKey?: string
}

/**
 * Get sheet configuration from environment
 */
export function getSheetConfig(): SheetConfig {
  return {
    sheetId: process.env.SHEET_ID || DEFAULT_SHEET_ID,
    gid: process.env.SHEET_GID || DEFAULT_SHEET_GID,
    apiKey: process.env.GOOGLE_SHEETS_API_KEY,
  }
}

/**
 * Result type for sheet fetching
 */
interface FetchResult {
  success: boolean
  headers: string[]
  rows: SheetRow[]
  source: 'api' | 'csv'
  error?: string
  troubleshooting?: string[]
}

/**
 * Option A: Fetch via Google Sheets API
 */
async function fetchViaApi(config: SheetConfig): Promise<FetchResult> {
  if (!config.apiKey) {
    return {
      success: false,
      headers: [],
      rows: [],
      source: 'api',
      error: 'No API key provided',
    }
  }

  try {
    // First, we need to get the sheet name from GID
    // The Sheets API uses sheet names, not GID for the range
    // We'll fetch metadata first to get the sheet name
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?key=${config.apiKey}`
    const metadataRes = await fetch(metadataUrl, { 
      next: { revalidate: 60 } // Cache for 60 seconds
    })
    
    if (!metadataRes.ok) {
      const errorText = await metadataRes.text()
      throw new Error(`Metadata fetch failed: ${metadataRes.status} - ${errorText}`)
    }
    
    const metadata = await metadataRes.json()
    
    // Find the sheet with the matching GID
    const targetSheet = metadata.sheets?.find(
      (sheet: { properties: { sheetId: number } }) => 
        sheet.properties.sheetId === parseInt(config.gid)
    )
    
    const sheetName = targetSheet?.properties?.title || 'Sheet1'
    
    // Now fetch the actual data
    const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(sheetName)}?key=${config.apiKey}`
    const dataRes = await fetch(dataUrl, {
      next: { revalidate: 60 } // Cache for 60 seconds
    })
    
    if (!dataRes.ok) {
      const errorText = await dataRes.text()
      throw new Error(`Data fetch failed: ${dataRes.status} - ${errorText}`)
    }
    
    const data = await dataRes.json()
    const values: string[][] = data.values || []
    
    if (values.length === 0) {
      return {
        success: true,
        headers: [],
        rows: [],
        source: 'api',
      }
    }
    
    // First row is headers
    const headers = values[0].map(h => String(h || '').trim())
    
    // Convert remaining rows to objects
    const rows: SheetRow[] = values.slice(1).map(row => {
      const obj: SheetRow = {}
      headers.forEach((header, idx) => {
        obj[header] = row[idx] !== undefined ? String(row[idx]) : ''
      })
      return obj
    })
    
    return {
      success: true,
      headers,
      rows,
      source: 'api',
    }
  } catch (error) {
    return {
      success: false,
      headers: [],
      rows: [],
      source: 'api',
      error: error instanceof Error ? error.message : 'API fetch failed',
      troubleshooting: [
        'Verify your GOOGLE_SHEETS_API_KEY is valid',
        'Ensure the Google Sheets API is enabled in your Google Cloud Console',
        'Check that the sheet ID is correct',
      ],
    }
  }
}

/**
 * Parse CSV safely handling quoted fields
 */
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"'
          i++ // Skip next quote
        } else {
          // End of quoted field
          inQuotes = false
        }
      } else {
        currentField += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentRow.push(currentField)
        currentField = ''
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField)
        if (currentRow.length > 0 && currentRow.some(f => f.trim() !== '')) {
          rows.push(currentRow)
        }
        currentRow = []
        currentField = ''
        if (char === '\r') i++ // Skip \n in \r\n
      } else if (char !== '\r') {
        currentField += char
      }
    }
  }
  
  // Don't forget the last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField)
    if (currentRow.some(f => f.trim() !== '')) {
      rows.push(currentRow)
    }
  }
  
  return rows
}

/**
 * Option B: Fetch via CSV export (for public sheets)
 */
async function fetchViaCSV(config: SheetConfig): Promise<FetchResult> {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${config.sheetId}/export?format=csv&gid=${config.gid}`
    
    const res = await fetch(csvUrl, {
      next: { revalidate: 60 }, // Cache for 60 seconds
      headers: {
        'Accept': 'text/csv',
      },
    })
    
    if (!res.ok) {
      throw new Error(`CSV fetch failed: ${res.status}`)
    }
    
    const csvText = await res.text()
    
    // Check if we got an HTML error page instead of CSV
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
      throw new Error('Received HTML instead of CSV - sheet may not be publicly accessible')
    }
    
    const parsed = parseCSV(csvText)
    
    if (parsed.length === 0) {
      return {
        success: true,
        headers: [],
        rows: [],
        source: 'csv',
      }
    }
    
    const headers = parsed[0].map(h => h.trim())
    
    const rows: SheetRow[] = parsed.slice(1).map(row => {
      const obj: SheetRow = {}
      headers.forEach((header, idx) => {
        obj[header] = row[idx] !== undefined ? row[idx] : ''
      })
      return obj
    })
    
    return {
      success: true,
      headers,
      rows,
      source: 'csv',
    }
  } catch (error) {
    return {
      success: false,
      headers: [],
      rows: [],
      source: 'csv',
      error: error instanceof Error ? error.message : 'CSV fetch failed',
      troubleshooting: [
        'Ensure the Google Sheet is shared as "Anyone with the link can view"',
        'Verify the Sheet ID and GID are correct',
        'Try accessing the CSV URL directly in a browser to test',
      ],
    }
  }
}

/**
 * Main fetch function - tries API first if key exists, falls back to CSV
 */
export async function fetchSheetData(): Promise<FetchResult> {
  const config = getSheetConfig()
  
  // Try API first if key is available
  if (config.apiKey) {
    const apiResult = await fetchViaApi(config)
    if (apiResult.success) {
      return apiResult
    }
    // Log the API error but continue to CSV fallback
    console.warn('API fetch failed, trying CSV fallback:', apiResult.error)
  }
  
  // Fallback to CSV
  const csvResult = await fetchViaCSV(config)
  
  if (!csvResult.success) {
    // Combine troubleshooting from both methods
    return {
      ...csvResult,
      troubleshooting: [
        ...(config.apiKey ? ['API fetch failed - check your API key configuration'] : ['No API key configured - add GOOGLE_SHEETS_API_KEY for private sheet access']),
        ...(csvResult.troubleshooting || []),
      ],
    }
  }
  
  return csvResult
}

