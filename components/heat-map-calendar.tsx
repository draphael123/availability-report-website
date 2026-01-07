'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ParsedSheetRow } from '@/lib/types'
import { generateMockHistory, MockHistorySummary } from '@/lib/mock-history'

interface DayData {
  date: string
  dateObj: Date
  totalRows: number
  errorCount: number
  avgDaysOut: number | null
  score: 'excellent' | 'good' | 'okay' | 'poor' | 'critical' | 'empty'
}

interface HeatMapCalendarProps {
  currentData?: ParsedSheetRow[]
}

export function HeatMapCalendar({ currentData = [] }: HeatMapCalendarProps) {
  const [loading, setLoading] = useState(true)
  const [historicalData, setHistoricalData] = useState<MockHistorySummary[]>([])
  const [usingMockData, setUsingMockData] = useState(false)

  // Try to fetch historical data from API, fall back to mock data
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history?range=month')
        const data = await res.json()
        if (data.summaries && data.summaries.length > 0) {
          setHistoricalData(data.summaries)
          setUsingMockData(false)
        } else if (currentData.length > 0) {
          // No API data available, use mock data based on current data
          const mockHistory = generateMockHistory(currentData, 35)
          setHistoricalData(mockHistory)
          setUsingMockData(true)
        }
      } catch (error) {
        console.error('Failed to fetch history:', error)
        // Fall back to mock data
        if (currentData.length > 0) {
          const mockHistory = generateMockHistory(currentData, 35)
          setHistoricalData(mockHistory)
          setUsingMockData(true)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [currentData])

  // Generate calendar data for last 35 days
  const calendarData = useMemo(() => {
    const days: DayData[] = []
    const today = new Date()
    
    // Create a map of historical data by date
    const historyMap = new Map<string, MockHistorySummary>()
    historicalData.forEach(item => {
      historyMap.set(item.date, item)
    })

    // Generate last 35 days (5 weeks)
    for (let i = 34; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const historyItem = historyMap.get(dateStr)
      
      let score: DayData['score'] = 'empty'
      let totalRows = 0
      let errorCount = 0
      let avgDaysOut: number | null = null

      if (historyItem) {
        totalRows = historyItem.summary.totalRows
        errorCount = historyItem.summary.errorCount
        avgDaysOut = historyItem.summary.avgDaysOut

        // Calculate score based on availability (avg days out) and error rate
        const errorRate = totalRows > 0 ? errorCount / totalRows : 0
        
        if (avgDaysOut !== null && avgDaysOut <= 7 && errorRate < 0.05) {
          score = 'excellent'
        } else if (avgDaysOut !== null && avgDaysOut <= 14 && errorRate < 0.10) {
          score = 'good'
        } else if (avgDaysOut !== null && avgDaysOut <= 21 && errorRate < 0.20) {
          score = 'okay'
        } else if (avgDaysOut !== null && avgDaysOut <= 30) {
          score = 'poor'
        } else if (totalRows > 0) {
          score = 'critical'
        }
      }

      days.push({
        date: dateStr,
        dateObj: date,
        totalRows,
        errorCount,
        avgDaysOut,
        score,
      })
    }

    return days
  }, [historicalData])

  // Group by weeks
  const weeks = useMemo(() => {
    const result: DayData[][] = []
    for (let i = 0; i < calendarData.length; i += 7) {
      result.push(calendarData.slice(i, i + 7))
    }
    return result
  }, [calendarData])

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const scoreColors: Record<DayData['score'], string> = {
    excellent: 'bg-emerald-500 dark:bg-emerald-400',
    good: 'bg-blue-500 dark:bg-blue-400',
    okay: 'bg-amber-500 dark:bg-amber-400',
    poor: 'bg-orange-500 dark:bg-orange-400',
    critical: 'bg-red-500 dark:bg-red-400',
    empty: 'bg-muted/50',
  }

  const scoreShadows: Record<DayData['score'], string> = {
    excellent: 'shadow-emerald-500/50',
    good: 'shadow-blue-500/50',
    okay: 'shadow-amber-500/50',
    poor: 'shadow-orange-500/50',
    critical: 'shadow-red-500/50',
    empty: '',
  }

  const daysWithData = calendarData.filter(d => d.score !== 'empty').length

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          <span className="text-gradient-primary">Activity Calendar</span>
          {usingMockData && (
            <span className="text-xs font-normal bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
              Simulated
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {daysWithData > 0 
            ? `Daily availability over the last 5 weeks (${daysWithData} days tracked)`
            : 'Historical snapshots will appear here as data is collected daily'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <span className="ml-2 text-sm text-muted-foreground">Loading history...</span>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs flex-wrap">
              <span className="text-muted-foreground">Avg Wait Time:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-muted/50" />
                <span className="text-muted-foreground">No data</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-muted-foreground">≤7 days</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-muted-foreground">≤14 days</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-muted-foreground">≤21 days</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-muted-foreground">30+ days</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-[10px] text-center text-muted-foreground font-medium">
                    {day}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIndex) => (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger>
                        <div
                          className={cn(
                            "aspect-square rounded-md transition-all duration-200 cursor-pointer",
                            "hover:scale-110 hover:shadow-lg",
                            scoreColors[day.score],
                            day.score !== 'empty' && scoreShadows[day.score]
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <div className="font-semibold">
                          {day.dateObj.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        {day.totalRows > 0 ? (
                          <div className="space-y-0.5 mt-1">
                            <div>{day.totalRows} links monitored</div>
                            <div>{day.errorCount} errors ({Math.round((day.errorCount / day.totalRows) * 100)}%)</div>
                            {day.avgDaysOut !== null && (
                              <div className="font-medium">
                                Avg wait: {day.avgDaysOut.toFixed(1)} days
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No snapshot taken</div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>

            {/* Info message about data source */}
            {usingMockData && (
              <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-center">
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  📊 Showing simulated historical data
                </p>
                <p className="text-muted-foreground mt-1">
                  Based on current data with realistic daily variations. Set up Vercel KV for real historical tracking.
                </p>
              </div>
            )}

            {/* Summary */}
            {daysWithData > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
                <span>
                  {calendarData.filter(d => d.score === 'excellent' || d.score === 'good').length} days with good availability
                </span>
                <span>
                  {calendarData.filter(d => d.score === 'poor' || d.score === 'critical').length} days need attention
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
