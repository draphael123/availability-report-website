import { SheetRow, ParsedSheetRow } from './types'

/**
 * Common column name variations for known fields
 */
const DAYS_OUT_COLUMNS = ['Days Out', 'DaysOut', 'days_out', 'Days_Out']
const AVAILABILITY_SCORE_COLUMNS = ['Availability Score', 'AvailabilityScore', 'availability_score', 'Score']
const SCRAPED_AT_COLUMNS = ['Scraped At', 'ScrapedAt', 'scraped_at', 'Scraped_At', 'Timestamp']
const ERROR_CODE_COLUMNS = ['Error Code', 'ErrorCode', 'error_code', 'Error_Code']
const ERROR_DETAILS_COLUMNS = ['Error Details', 'ErrorDetails', 'error_details', 'Error_Details', 'Error']

/**
 * Find a column value by trying multiple possible column names
 */
function findColumnValue(row: SheetRow, possibleNames: string[]): string | undefined {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== '') {
      return row[name]
    }
  }
  return undefined
}

/**
 * Parse a string to number, returning null if not valid
 */
function parseNumber(value: string | undefined): number | null {
  if (value === undefined || value === '') return null
  
  // Remove common formatting
  const cleaned = value.replace(/[,$%]/g, '').trim()
  const num = parseFloat(cleaned)
  
  return isNaN(num) ? null : num
}

/**
 * Parse a string to Date, returning null if not valid
 */
function parseDate(value: string | undefined): Date | null {
  if (value === undefined || value === '') return null
  
  // Try parsing the date string
  const date = new Date(value)
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    // Try some common date formats
    // MM/DD/YYYY or DD/MM/YYYY
    const parts = value.split(/[\/\-]/)
    if (parts.length === 3) {
      // Try MM/DD/YYYY first (US format)
      const usDate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`)
      if (!isNaN(usDate.getTime())) return usDate
      
      // Try DD/MM/YYYY (EU format)
      const euDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      if (!isNaN(euDate.getTime())) return euDate
    }
    return null
  }
  
  return date
}

/**
 * Check if a row has an error (non-empty error code or details)
 */
function hasError(row: SheetRow): boolean {
  const errorCode = findColumnValue(row, ERROR_CODE_COLUMNS)
  const errorDetails = findColumnValue(row, ERROR_DETAILS_COLUMNS)
  
  return (errorCode !== undefined && errorCode.trim() !== '') ||
         (errorDetails !== undefined && errorDetails.trim() !== '')
}

/**
 * Parse raw sheet rows into typed, normalized data
 */
export function parseSheetRows(rows: SheetRow[]): ParsedSheetRow[] {
  return rows.map((row, index) => {
    const daysOutRaw = findColumnValue(row, DAYS_OUT_COLUMNS)
    const availabilityScoreRaw = findColumnValue(row, AVAILABILITY_SCORE_COLUMNS)
    const scrapedAtRaw = findColumnValue(row, SCRAPED_AT_COLUMNS)
    
    return {
      raw: row,
      daysOut: parseNumber(daysOutRaw),
      availabilityScore: parseNumber(availabilityScoreRaw),
      scrapedAt: parseDate(scrapedAtRaw),
      hasError: hasError(row),
      rowIndex: index,
    }
  })
}

/**
 * Get unique values for a specific column (for filter dropdowns)
 */
export function getUniqueColumnValues(rows: ParsedSheetRow[], columnName: string): string[] {
  const values = new Set<string>()
  
  rows.forEach(row => {
    const value = row.raw[columnName]
    if (value && value.trim() !== '') {
      values.add(value.trim())
    }
  })
  
  return Array.from(values).sort()
}

/**
 * Calculate chart data for category breakdown
 */
export function calculateCategoryChartData(
  rows: ParsedSheetRow[],
  categoryColumn: string = 'Category'
): { category: string; count: number; avgDaysOut: number | null }[] {
  const categoryMap = new Map<string, { count: number; daysOutSum: number; daysOutCount: number }>()
  
  rows.forEach(row => {
    const category = row.raw[categoryColumn] || 'Uncategorized'
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { count: 0, daysOutSum: 0, daysOutCount: 0 })
    }
    
    const stats = categoryMap.get(category)!
    stats.count++
    
    if (row.daysOut !== null) {
      stats.daysOutSum += row.daysOut
      stats.daysOutCount++
    }
  })
  
  return Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      count: stats.count,
      avgDaysOut: stats.daysOutCount > 0 
        ? Math.round((stats.daysOutSum / stats.daysOutCount) * 10) / 10 
        : null,
    }))
    .sort((a, b) => b.count - a.count)
}

