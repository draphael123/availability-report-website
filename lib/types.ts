/**
 * Generic row type from the Google Sheet
 * Keys are derived from header row, values are raw strings
 */
export type SheetRow = Record<string, string>

/**
 * Category types for filtering
 */
export type CategoryType = 'all' | 'HRT' | 'TRT' | 'Provider'

/**
 * Parsed/normalized row with typed fields
 * Retains raw strings but adds parsed numeric/date fields
 */
export interface ParsedSheetRow {
  // Original raw data (all columns from sheet)
  raw: SheetRow
  
  // Parsed fields (when available and parseable)
  daysOut: number | null
  availabilityScore: number | null
  scrapedAt: Date | null
  
  // Convenience flags
  hasError: boolean
  
  // Category type (derived from Category column)
  categoryType: CategoryType
  
  // Index for stable identification
  rowIndex: number
}

/**
 * Response from the /api/sheet endpoint
 */
export interface SheetDataResponse {
  success: boolean
  data: ParsedSheetRow[]
  headers: string[]
  fetchedAt: string
  source: 'api' | 'csv'
  error?: string
  troubleshooting?: string[]
}

/**
 * Filter state for the data table
 */
export interface FilterState {
  globalSearch: string
  categoryType: CategoryType
  category: string | null
  location: string | null
  daysOutMin: number | null
  daysOutMax: number | null
  errorsOnly: boolean
}

/**
 * Column visibility state
 */
export type ColumnVisibility = Record<string, boolean>

/**
 * Chart data point
 */
export interface CategoryChartData {
  category: string
  count: number
  avgDaysOut: number | null
}

/**
 * Weekly trend data point
 */
export interface WeeklyTrendData {
  date: string
  dateLabel: string
  totalRows: number
  avgDaysOut: number | null
  errorCount: number
  hrtCount: number
  trtCount: number
  providerCount: number
}

/**
 * Summary statistics
 */
export interface SummaryStats {
  totalRows: number
  totalCategories: number
  avgDaysOut: number | null
  errorRate: number
  hrtCount: number
  trtCount: number
  providerCount: number
  lastWeekTrend: WeeklyTrendData[]
}
