import { ParsedSheetRow, WeeklyTrendData } from './types'

/**
 * Historical data point for a single link
 */
export interface LinkHistoryPoint {
  date: string
  daysOut: number | null
  availabilityScore: number | null
  hasError: boolean
}

/**
 * Aggregated historical data for comparisons
 */
export interface HistoricalComparison {
  current: AggregatedStats
  previous: AggregatedStats
  change: ChangeStats
}

export interface AggregatedStats {
  totalRows: number
  avgDaysOut: number | null
  errorRate: number
  hrtCount: number
  trtCount: number
  providerCount: number
}

export interface ChangeStats {
  totalRows: number
  avgDaysOut: number | null
  errorRate: number
}

/**
 * Alert types for anomaly detection
 */
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertType = 'days_out_spike' | 'new_error' | 'error_resolved' | 'availability_drop' | 'availability_improvement'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  linkName?: string
  linkUrl?: string
  value?: number
  previousValue?: number
  timestamp: Date
}

/**
 * Detect anomalies and generate alerts
 */
export function detectAnomalies(
  currentData: ParsedSheetRow[],
  previousData?: ParsedSheetRow[]
): Alert[] {
  const alerts: Alert[] = []
  const now = new Date()

  // If no previous data, we can't compare
  if (!previousData || previousData.length === 0) {
    return alerts
  }

  // Create lookup map for previous data by name
  const previousByName = new Map<string, ParsedSheetRow>()
  previousData.forEach(row => {
    const name = row.raw['Name'] || row.raw['name'] || ''
    if (name) previousByName.set(name, row)
  })

  // Check each current row against previous
  currentData.forEach(row => {
    const name = row.raw['Name'] || row.raw['name'] || ''
    const url = row.raw['URL'] || row.raw['url'] || ''
    const prev = previousByName.get(name)

    if (!prev) return // New row, skip for now

    // Check for Days Out spike (>50% increase)
    if (row.daysOut !== null && prev.daysOut !== null && prev.daysOut > 0) {
      const percentChange = ((row.daysOut - prev.daysOut) / prev.daysOut) * 100
      if (percentChange >= 50) {
        alerts.push({
          id: `days-spike-${name}-${now.getTime()}`,
          type: 'days_out_spike',
          severity: percentChange >= 100 ? 'critical' : 'warning',
          title: 'Days Out Spike Detected',
          message: `${name} days out increased by ${percentChange.toFixed(0)}% (${prev.daysOut} → ${row.daysOut})`,
          linkName: name,
          linkUrl: url,
          value: row.daysOut,
          previousValue: prev.daysOut,
          timestamp: now,
        })
      }
    }

    // Check for new errors
    if (row.hasError && !prev.hasError) {
      alerts.push({
        id: `new-error-${name}-${now.getTime()}`,
        type: 'new_error',
        severity: 'critical',
        title: 'New Error Detected',
        message: `${name} is now showing an error`,
        linkName: name,
        linkUrl: url,
        timestamp: now,
      })
    }

    // Check for resolved errors
    if (!row.hasError && prev.hasError) {
      alerts.push({
        id: `error-resolved-${name}-${now.getTime()}`,
        type: 'error_resolved',
        severity: 'info',
        title: 'Error Resolved',
        message: `${name} error has been resolved`,
        linkName: name,
        linkUrl: url,
        timestamp: now,
      })
    }

    // Check for availability score drop (>20 points)
    if (row.availabilityScore !== null && prev.availabilityScore !== null) {
      const scoreDrop = prev.availabilityScore - row.availabilityScore
      if (scoreDrop >= 20) {
        alerts.push({
          id: `score-drop-${name}-${now.getTime()}`,
          type: 'availability_drop',
          severity: scoreDrop >= 40 ? 'critical' : 'warning',
          title: 'Availability Score Drop',
          message: `${name} score dropped by ${scoreDrop} points (${prev.availabilityScore} → ${row.availabilityScore})`,
          linkName: name,
          linkUrl: url,
          value: row.availabilityScore,
          previousValue: prev.availabilityScore,
          timestamp: now,
        })
      }
    }
  })

  // Sort by severity (critical first)
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return alerts
}

/**
 * Calculate performance benchmarks
 */
export interface PerformanceBenchmark {
  name: string
  url: string
  daysOut: number | null
  categoryAvg: number | null
  vsAverage: number | null // Percentage difference from average
  rank: number
  totalInCategory: number
  status: 'excellent' | 'good' | 'average' | 'poor' | 'critical'
}

export function calculateBenchmarks(
  data: ParsedSheetRow[],
  categoryType?: string
): PerformanceBenchmark[] {
  // Filter by category type if specified
  const filtered = categoryType && categoryType !== 'all'
    ? data.filter(r => r.categoryType === categoryType)
    : data

  // Calculate category average
  const withDaysOut = filtered.filter(r => r.daysOut !== null)
  const categoryAvg = withDaysOut.length > 0
    ? withDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / withDaysOut.length
    : null

  // Create benchmarks
  const benchmarks: PerformanceBenchmark[] = filtered.map(row => {
    const name = row.raw['Name'] || row.raw['name'] || `Row ${row.rowIndex}`
    const url = row.raw['URL'] || row.raw['url'] || ''
    const daysOut = row.daysOut

    let vsAverage: number | null = null
    if (daysOut !== null && categoryAvg !== null && categoryAvg > 0) {
      vsAverage = ((daysOut - categoryAvg) / categoryAvg) * 100
    }

    let status: PerformanceBenchmark['status'] = 'average'
    if (daysOut === null) {
      status = 'average'
    } else if (daysOut <= 7) {
      status = 'excellent'
    } else if (daysOut <= 14) {
      status = 'good'
    } else if (daysOut <= 30) {
      status = 'average'
    } else if (daysOut <= 60) {
      status = 'poor'
    } else {
      status = 'critical'
    }

    return {
      name,
      url,
      daysOut,
      categoryAvg,
      vsAverage,
      rank: 0, // Will be set after sorting
      totalInCategory: filtered.length,
      status,
    }
  })

  // Sort by days out (ascending, nulls last) and assign ranks
  benchmarks.sort((a, b) => {
    if (a.daysOut === null && b.daysOut === null) return 0
    if (a.daysOut === null) return 1
    if (b.daysOut === null) return -1
    return a.daysOut - b.daysOut
  })

  benchmarks.forEach((b, i) => {
    b.rank = i + 1
  })

  return benchmarks
}

/**
 * Generate sparkline data for a metric over time
 */
export function generateSparklineData(
  history: LinkHistoryPoint[],
  metric: 'daysOut' | 'availabilityScore'
): number[] {
  return history
    .slice(-7) // Last 7 data points
    .map(h => h[metric] ?? 0)
}

/**
 * Calculate day-over-day comparison
 */
export function calculateDayOverDay(
  todayData: ParsedSheetRow[],
  yesterdayData: ParsedSheetRow[]
): HistoricalComparison {
  const calcStats = (data: ParsedSheetRow[]): AggregatedStats => {
    const withDaysOut = data.filter(r => r.daysOut !== null)
    const avgDaysOut = withDaysOut.length > 0
      ? withDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / withDaysOut.length
      : null

    const errorCount = data.filter(r => r.hasError).length
    const errorRate = data.length > 0 ? (errorCount / data.length) * 100 : 0

    return {
      totalRows: data.length,
      avgDaysOut: avgDaysOut !== null ? Math.round(avgDaysOut * 10) / 10 : null,
      errorRate: Math.round(errorRate * 10) / 10,
      hrtCount: data.filter(r => r.categoryType === 'HRT').length,
      trtCount: data.filter(r => r.categoryType === 'TRT').length,
      providerCount: data.filter(r => r.categoryType === 'Provider').length,
    }
  }

  const current = calcStats(todayData)
  const previous = calcStats(yesterdayData)

  return {
    current,
    previous,
    change: {
      totalRows: current.totalRows - previous.totalRows,
      avgDaysOut: current.avgDaysOut !== null && previous.avgDaysOut !== null
        ? Math.round((current.avgDaysOut - previous.avgDaysOut) * 10) / 10
        : null,
      errorRate: Math.round((current.errorRate - previous.errorRate) * 10) / 10,
    },
  }
}




