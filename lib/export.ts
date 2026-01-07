import { ParsedSheetRow } from './types'

/**
 * Convert data to CSV format
 */
export function convertToCSV(
  data: ParsedSheetRow[],
  headers: string[]
): string {
  // Add Type column to headers
  const allHeaders = ['Type', ...headers]
  
  // Create header row
  const headerRow = allHeaders.map(h => `"${h}"`).join(',')
  
  // Create data rows
  const dataRows = data.map(row => {
    const values = allHeaders.map(header => {
      if (header === 'Type') {
        return `"${row.categoryType}"`
      }
      const value = row.raw[header] || ''
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`
    })
    return values.join(',')
  })
  
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Download data as CSV file
 */
export function downloadCSV(
  data: ParsedSheetRow[],
  headers: string[],
  filename: string = 'oncehub-availability-report'
): void {
  const csv = convertToCSV(data, headers)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download chart as image
 */
export function downloadChartAsImage(
  chartElement: HTMLElement,
  filename: string = 'chart'
): void {
  // This would require html2canvas library
  // For now, we'll provide the infrastructure
  console.log('Chart download requested for:', filename)
}

/**
 * Generate summary report text
 */
export function generateSummaryReport(
  data: ParsedSheetRow[],
  headers: string[]
): string {
  const total = data.length
  const withErrors = data.filter(r => r.hasError).length
  const errorRate = total > 0 ? ((withErrors / total) * 100).toFixed(1) : '0'
  
  const withDaysOut = data.filter(r => r.daysOut !== null)
  const avgDaysOut = withDaysOut.length > 0
    ? (withDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / withDaysOut.length).toFixed(1)
    : 'N/A'
  
  const hrtCount = data.filter(r => r.categoryType === 'HRT').length
  const trtCount = data.filter(r => r.categoryType === 'TRT').length
  const providerCount = data.filter(r => r.categoryType === 'Provider').length
  
  const report = `
ONCEHUB AVAILABILITY REPORT
Generated: ${new Date().toLocaleString()}
========================================

SUMMARY
-------
Total Links: ${total}
Error Rate: ${errorRate}%
Average Days Out: ${avgDaysOut}

BY TYPE
-------
HRT: ${hrtCount}
TRT: ${trtCount}
Provider: ${providerCount}
Other: ${total - hrtCount - trtCount - providerCount}

ERRORS (${withErrors} total)
-------
${data.filter(r => r.hasError).map(r => {
  const name = r.raw['Name'] || r.raw['name'] || 'Unknown'
  const error = r.raw['Error Details'] || r.raw['Error Code'] || 'Unknown error'
  return `- ${name}: ${error}`
}).join('\n') || 'No errors detected'}

TOP 10 BY DAYS OUT
------------------
${data
  .filter(r => r.daysOut !== null)
  .sort((a, b) => (b.daysOut || 0) - (a.daysOut || 0))
  .slice(0, 10)
  .map((r, i) => {
    const name = r.raw['Name'] || r.raw['name'] || 'Unknown'
    return `${i + 1}. ${name}: ${r.daysOut} days`
  }).join('\n') || 'No data available'}
`
  
  return report.trim()
}

/**
 * Download summary report as text file
 */
export function downloadSummaryReport(
  data: ParsedSheetRow[],
  headers: string[]
): void {
  const report = generateSummaryReport(data, headers)
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `oncehub-report-${new Date().toISOString().split('T')[0]}.txt`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}



