'use client'

import { useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ParsedSheetRow } from '@/lib/types'

interface HeatMapCalendarProps {
  data: ParsedSheetRow[]
}

interface DayData {
  date: Date
  dateStr: string
  count: number
  errorCount: number
  avgDaysOut: number | null
  score: 'excellent' | 'good' | 'okay' | 'poor' | 'critical' | 'empty'
}

export function HeatMapCalendar({ data }: HeatMapCalendarProps) {
  // Generate last 35 days of data
  const calendarData = useMemo(() => {
    const days: DayData[] = []
    const today = new Date()
    
    // Group data by scraped date
    const dataByDate = new Map<string, ParsedSheetRow[]>()
    data.forEach(row => {
      if (row.scrapedAt) {
        const dateStr = row.scrapedAt.toISOString().split('T')[0]
        if (!dataByDate.has(dateStr)) {
          dataByDate.set(dateStr, [])
        }
        dataByDate.get(dateStr)!.push(row)
      }
    })

    // Generate last 35 days (5 weeks)
    for (let i = 34; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayRows = dataByDate.get(dateStr) || []
      const errorCount = dayRows.filter(r => r.hasError).length
      const rowsWithDaysOut = dayRows.filter(r => r.daysOut !== null)
      const avgDaysOut = rowsWithDaysOut.length > 0
        ? rowsWithDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / rowsWithDaysOut.length
        : null

      // Calculate score
      let score: DayData['score'] = 'empty'
      if (dayRows.length > 0) {
        const errorRate = errorCount / dayRows.length
        if (errorRate === 0 && avgDaysOut !== null && avgDaysOut <= 14) {
          score = 'excellent'
        } else if (errorRate <= 0.05 && (avgDaysOut === null || avgDaysOut <= 21)) {
          score = 'good'
        } else if (errorRate <= 0.15 && (avgDaysOut === null || avgDaysOut <= 30)) {
          score = 'okay'
        } else if (errorRate <= 0.25) {
          score = 'poor'
        } else {
          score = 'critical'
        }
      }

      days.push({
        date,
        dateStr,
        count: dayRows.length,
        errorCount,
        avgDaysOut,
        score,
      })
    }

    return days
  }, [data])

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

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          <span className="text-gradient-primary">Activity Calendar</span>
        </CardTitle>
        <CardDescription>Daily performance over the last 5 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <span className="text-muted-foreground">Quality:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted/50" />
            <span className="text-muted-foreground">No data</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-muted-foreground">Okay</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">Excellent</span>
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
                      {day.date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    {day.count > 0 ? (
                      <div className="space-y-0.5 mt-1">
                        <div>{day.count} links scraped</div>
                        <div>{day.errorCount} errors ({Math.round((day.errorCount / day.count) * 100)}%)</div>
                        {day.avgDaysOut !== null && (
                          <div>Avg days out: {day.avgDaysOut.toFixed(1)}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No data</div>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
          <span>
            {calendarData.filter(d => d.score === 'excellent' || d.score === 'good').length} good days
          </span>
          <span>
            {calendarData.filter(d => d.score === 'poor' || d.score === 'critical').length} days need attention
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

