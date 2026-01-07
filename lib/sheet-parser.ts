import { SheetRow, ParsedSheetRow, CategoryType, WeeklyTrendData, SummaryStats } from './types'

/**
 * Common column name variations for known fields
 */
const DAYS_OUT_COLUMNS = ['Days Out', 'DaysOut', 'days_out', 'Days_Out']
const AVAILABILITY_SCORE_COLUMNS = ['Availability Score', 'AvailabilityScore', 'availability_score', 'Score']
const SCRAPED_AT_COLUMNS = ['Scraped At', 'ScrapedAt', 'scraped_at', 'Scraped_At', 'Timestamp']
const ERROR_CODE_COLUMNS = ['Error Code', 'ErrorCode', 'error_code', 'Error_Code']
const ERROR_DETAILS_COLUMNS = ['Error Details', 'ErrorDetails', 'error_details', 'Error_Details', 'Error']
const CATEGORY_COLUMNS = ['Category', 'category', 'Type', 'type']

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
 * Determine category type (HRT, TRT, or Provider) from row data
 * Searches ALL columns for identifiers:
 * - HRT: Any column starts with or contains "HRT"
 * - TRT: Any column starts with or contains "TRT"  
 * - Provider: Any column contains "provider"
 */
function determineCategoryType(row: SheetRow): CategoryType {
  // Combine all values from the row into one string for searching
  const allValues = Object.values(row).join(' ').toUpperCase()
  
  // Also check individual important columns
  const name = row['Name'] || row['name'] || row['NAME'] || ''
  const category = row['Category'] || row['category'] || ''
  const url = row['URL'] || row['url'] || ''
  const combined = `${name} ${category} ${url}`.toUpperCase()
  
  // Check for HRT - look for "HRT" at start of any word or as standalone
  if (/\bHRT\b/.test(combined) || /\bHRT\b/.test(allValues) || combined.includes('HRT ') || combined.startsWith('HRT')) {
    return 'HRT'
  }
  
  // Check for TRT - look for "TRT" at start of any word or as standalone
  if (/\bTRT\b/.test(combined) || /\bTRT\b/.test(allValues) || combined.includes('TRT ') || combined.startsWith('TRT')) {
    return 'TRT'
  }
  
  // Check for Provider
  if (combined.includes('PROVIDER') || allValues.includes('PROVIDER')) {
    return 'Provider'
  }
  
  return 'all'
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
      categoryType: determineCategoryType(row),
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

/**
 * Calculate weekly trend data from the last 7 days
 */
export function calculateWeeklyTrend(rows: ParsedSheetRow[]): WeeklyTrendData[] {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Group by date
  const dateMap = new Map<string, {
    rows: ParsedSheetRow[]
    date: Date
  }>()
  
  // Initialize all 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateKey = date.toISOString().split('T')[0]
    dateMap.set(dateKey, { rows: [], date })
  }
  
  // Assign rows to their dates
  rows.forEach(row => {
    if (row.scrapedAt && row.scrapedAt >= weekAgo) {
      const dateKey = row.scrapedAt.toISOString().split('T')[0]
      if (dateMap.has(dateKey)) {
        dateMap.get(dateKey)!.rows.push(row)
      }
    }
  })
  
  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, { rows: dayRows, date }]) => {
      const daysOutValues = dayRows.filter(r => r.daysOut !== null).map(r => r.daysOut!)
      const avgDaysOut = daysOutValues.length > 0
        ? Math.round((daysOutValues.reduce((a, b) => a + b, 0) / daysOutValues.length) * 10) / 10
        : null
      
      return {
        date: dateKey,
        dateLabel: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        totalRows: dayRows.length,
        avgDaysOut,
        errorCount: dayRows.filter(r => r.hasError).length,
        hrtCount: dayRows.filter(r => r.categoryType === 'HRT').length,
        trtCount: dayRows.filter(r => r.categoryType === 'TRT').length,
        providerCount: dayRows.filter(r => r.categoryType === 'Provider').length,
      }
    })
}

/**
 * Calculate summary statistics
 */
export function calculateSummaryStats(rows: ParsedSheetRow[]): SummaryStats {
  const categories = new Set(rows.map(r => r.raw['Category']).filter(Boolean))
  const daysOutValues = rows.filter(r => r.daysOut !== null).map(r => r.daysOut!)
  const avgDaysOut = daysOutValues.length > 0
    ? Math.round((daysOutValues.reduce((a, b) => a + b, 0) / daysOutValues.length) * 10) / 10
    : null
  
  const errorCount = rows.filter(r => r.hasError).length
  const errorRate = rows.length > 0 ? Math.round((errorCount / rows.length) * 100) : 0
  
  return {
    totalRows: rows.length,
    totalCategories: categories.size,
    avgDaysOut,
    errorRate,
    hrtCount: rows.filter(r => r.categoryType === 'HRT').length,
    trtCount: rows.filter(r => r.categoryType === 'TRT').length,
    providerCount: rows.filter(r => r.categoryType === 'Provider').length,
    lastWeekTrend: calculateWeeklyTrend(rows),
  }
}
