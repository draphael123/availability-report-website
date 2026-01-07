import { ParsedSheetRow } from './types'

export interface MockHistorySummary {
  date: string
  summary: {
    totalRows: number
    hrtCount: number
    trtCount: number
    providerCount: number
    errorCount: number
    avgDaysOut: number | null
  }
}

/**
 * Generate simulated historical data based on current data
 * This creates realistic variations over the past N days
 */
export function generateMockHistory(
  currentData: ParsedSheetRow[],
  days: number = 35
): MockHistorySummary[] {
  const history: MockHistorySummary[] = []
  const today = new Date()
  
  // Calculate current stats as baseline
  const currentStats = calculateStats(currentData)
  
  // Generate data for each day going backwards
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Add some realistic variation
    // More recent days are closer to current values
    const variationFactor = 1 + (i / days) * 0.3 // Up to 30% variation for older dates
    const randomFactor = 0.9 + Math.random() * 0.2 // Random ±10%
    
    // Simulate weekend patterns (slightly different metrics)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const weekendFactor = isWeekend ? 1.05 : 1
    
    // Calculate simulated values with natural variation
    const simulatedAvgDaysOut = currentStats.avgDaysOut !== null
      ? Math.max(1, Math.round(currentStats.avgDaysOut * variationFactor * randomFactor * weekendFactor * 10) / 10)
      : null
    
    const errorVariation = Math.floor(Math.random() * 3) - 1 // -1, 0, or 1
    const simulatedErrorCount = Math.max(0, currentStats.errorCount + errorVariation)
    
    history.push({
      date: dateStr,
      summary: {
        totalRows: currentStats.totalRows,
        hrtCount: currentStats.hrtCount,
        trtCount: currentStats.trtCount,
        providerCount: currentStats.providerCount,
        errorCount: simulatedErrorCount,
        avgDaysOut: simulatedAvgDaysOut,
      }
    })
  }
  
  return history
}

function calculateStats(data: ParsedSheetRow[]) {
  const withDaysOut = data.filter(r => r.daysOut !== null)
  const avgDaysOut = withDaysOut.length > 0
    ? withDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / withDaysOut.length
    : null
  
  return {
    totalRows: data.length,
    hrtCount: data.filter(r => r.categoryType === 'HRT').length,
    trtCount: data.filter(r => r.categoryType === 'TRT').length,
    providerCount: data.filter(r => r.categoryType === 'Provider').length,
    errorCount: data.filter(r => r.hasError).length,
    avgDaysOut: avgDaysOut !== null ? Math.round(avgDaysOut * 10) / 10 : null,
  }
}

/**
 * Generate week-over-week comparison data for links
 */
export function generateMockLinkHistory(
  currentData: ParsedSheetRow[]
): { name: string; currentDaysOut: number | null; lastWeekDaysOut: number | null; change: number | null }[] {
  return currentData.map(row => {
    const name = row.raw['Name'] || row.raw['name'] || `Row ${row.rowIndex}`
    const currentDaysOut = row.daysOut
    
    // Generate simulated last week value (±30% variation)
    let lastWeekDaysOut: number | null = null
    if (currentDaysOut !== null) {
      const variation = 0.7 + Math.random() * 0.6 // 0.7 to 1.3
      lastWeekDaysOut = Math.max(1, Math.round(currentDaysOut * variation))
    }
    
    const change = currentDaysOut !== null && lastWeekDaysOut !== null
      ? currentDaysOut - lastWeekDaysOut
      : null
    
    return {
      name,
      currentDaysOut,
      lastWeekDaysOut,
      change,
    }
  })
}

