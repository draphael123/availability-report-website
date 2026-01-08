'use client'

import { useMemo } from 'react'
import { Clock, Calendar, Sun, Moon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TimePatternsProps {
  data: ParsedSheetRow[]
}

export function TimePatterns({ data }: TimePatternsProps) {
  // Calculate current stats for baseline
  const baseStats = useMemo(() => {
    const withDaysOut = data.filter(r => r.daysOut !== null)
    return {
      avgDaysOut: withDaysOut.length > 0
        ? withDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / withDaysOut.length
        : 0,
      count: withDaysOut.length,
    }
  }, [data])

  // Simulated day-of-week patterns
  const dayOfWeekData = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    // Simulate patterns: weekdays tend to have better availability
    const patterns = [0.9, 0.85, 0.88, 0.92, 0.95, 1.1, 1.15] // multipliers
    
    return days.map((day, idx) => ({
      day,
      shortDay: day.slice(0, 3),
      avgDaysOut: Math.round(baseStats.avgDaysOut * patterns[idx] * 10) / 10,
      variance: Math.round(Math.random() * 20) / 10,
      isWeekend: idx >= 5,
      recommendation: patterns[idx] < 1 ? 'good' : patterns[idx] > 1.05 ? 'avoid' : 'neutral',
    }))
  }, [baseStats.avgDaysOut])

  // Simulated time-of-day patterns
  const timeOfDayData = useMemo(() => {
    const periods = [
      { period: '6-9 AM', label: 'Early Morning', multiplier: 0.95 },
      { period: '9-12 PM', label: 'Morning', multiplier: 0.85 },
      { period: '12-3 PM', label: 'Afternoon', multiplier: 0.9 },
      { period: '3-6 PM', label: 'Late Afternoon', multiplier: 1.0 },
      { period: '6-9 PM', label: 'Evening', multiplier: 1.1 },
      { period: '9-12 AM', label: 'Night', multiplier: 1.15 },
    ]
    
    return periods.map(p => ({
      ...p,
      avgDaysOut: Math.round(baseStats.avgDaysOut * p.multiplier * 10) / 10,
      recommendation: p.multiplier < 0.9 ? 'best' : p.multiplier > 1.05 ? 'avoid' : 'ok',
    }))
  }, [baseStats.avgDaysOut])

  // Weekly trend (last 4 weeks simulated)
  const weeklyTrend = useMemo(() => {
    const weeks = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7))
      const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      // Simulate slight improvement over time
      const trendMultiplier = 1 + (i * 0.05)
      const randomVariation = 0.9 + Math.random() * 0.2
      
      weeks.push({
        week: `Week of ${weekLabel}`,
        avgDaysOut: Math.round(baseStats.avgDaysOut * trendMultiplier * randomVariation * 10) / 10,
        linksMonitored: baseStats.count + Math.floor(Math.random() * 5) - 2,
        errorRate: Math.round(Math.random() * 10),
      })
    }
    return weeks
  }, [baseStats])

  // Best times to check/book
  const bestTimes = useMemo(() => {
    const sortedDays = [...dayOfWeekData].sort((a, b) => a.avgDaysOut - b.avgDaysOut)
    const sortedTimes = [...timeOfDayData].sort((a, b) => a.avgDaysOut - b.avgDaysOut)
    
    return {
      bestDays: sortedDays.slice(0, 3),
      bestTimes: sortedTimes.slice(0, 2),
      worstDays: sortedDays.slice(-2),
      worstTimes: sortedTimes.slice(-2),
    }
  }, [dayOfWeekData, timeOfDayData])

  // Seasonal patterns (simplified)
  const seasonalInsights = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const seasons = {
      winter: [11, 0, 1],
      spring: [2, 3, 4],
      summer: [5, 6, 7],
      fall: [8, 9, 10],
    }
    
    let currentSeason = 'summer'
    for (const [season, months] of Object.entries(seasons)) {
      if (months.includes(currentMonth)) {
        currentSeason = season
        break
      }
    }
    
    const seasonalPatterns = {
      winter: { trend: 'higher', reason: 'Holiday schedules and flu season' },
      spring: { trend: 'moderate', reason: 'Allergy season, steady demand' },
      summer: { trend: 'lower', reason: 'Vacation schedules, typically lighter' },
      fall: { trend: 'increasing', reason: 'Back-to-school, pre-holiday rush' },
    }
    
    return {
      currentSeason,
      ...seasonalPatterns[currentSeason as keyof typeof seasonalPatterns],
    }
  }, [])

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          <span className="text-gradient-primary">Time-Based Patterns</span>
        </CardTitle>
        <CardDescription>Best times to check availability and booking patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Best Times Summary */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Sun className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold text-emerald-400">Best Times to Book</span>
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Days: </span>
                <span className="font-medium">{bestTimes.bestDays.map(d => d.shortDay).join(', ')}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Time: </span>
                <span className="font-medium">{bestTimes.bestTimes.map(t => t.period).join(', ')}</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                ~{bestTimes.bestDays[0]?.avgDaysOut}d avg wait
              </Badge>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-red-400">Avoid If Possible</span>
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Days: </span>
                <span className="font-medium">{bestTimes.worstDays.map(d => d.shortDay).join(', ')}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Time: </span>
                <span className="font-medium">{bestTimes.worstTimes.map(t => t.period).join(', ')}</span>
              </div>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                ~{bestTimes.worstDays[0]?.avgDaysOut}d avg wait
              </Badge>
            </div>
          </div>
        </div>

        {/* Day of Week Chart */}
        <div className="p-4 rounded-lg border bg-muted/20">
          <h4 className="font-semibold mb-4 text-sm">Average Wait by Day of Week</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="shortDay" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value} days`, 'Avg Wait']}
                />
                <Bar 
                  dataKey="avgDaysOut" 
                  radius={[4, 4, 0, 0]}
                  fill="#8b5cf6"
                >
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time of Day Chart */}
        <div className="p-4 rounded-lg border bg-muted/20">
          <h4 className="font-semibold mb-4 text-sm">Average Wait by Time of Day</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeOfDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="period" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value} days`, 'Avg Wait']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgDaysOut" 
                  stroke="#ec4899" 
                  strokeWidth={2}
                  dot={{ fill: '#ec4899', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="p-4 rounded-lg border bg-muted/20">
          <h4 className="font-semibold mb-4 text-sm">4-Week Trend</h4>
          <div className="grid grid-cols-4 gap-2">
            {weeklyTrend.map((week, idx) => {
              const prevWeek = weeklyTrend[idx - 1]
              const change = prevWeek ? week.avgDaysOut - prevWeek.avgDaysOut : 0
              
              return (
                <div key={idx} className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">{week.week}</div>
                  <div className="text-lg font-bold">{week.avgDaysOut}d</div>
                  {idx > 0 && (
                    <div className={cn(
                      "text-xs flex items-center justify-center gap-1",
                      change < 0 ? "text-emerald-400" : change > 0 ? "text-red-400" : "text-muted-foreground"
                    )}>
                      {change < 0 ? <TrendingDown className="h-3 w-3" /> : 
                       change > 0 ? <TrendingUp className="h-3 w-3" /> : 
                       <Minus className="h-3 w-3" />}
                      {change > 0 ? '+' : ''}{change.toFixed(1)}d
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Seasonal Insight */}
        <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span className="font-semibold text-blue-400">Seasonal Insight</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Current season ({seasonalInsights.currentSeason}): </span>
            <span className="font-medium">Wait times typically {seasonalInsights.trend}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {seasonalInsights.reason}
          </div>
        </div>

        {/* Note */}
        <div className="text-xs text-muted-foreground text-center">
          * Patterns based on simulated historical data. Actual patterns may vary.
        </div>
      </CardContent>
    </Card>
  )
}




