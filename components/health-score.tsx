'use client'

import { useMemo } from 'react'
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ParsedSheetRow } from '@/lib/types'

interface HealthScoreProps {
  data: ParsedSheetRow[]
  previousErrorCount?: number
}

interface ScoreBreakdown {
  errorScore: number
  availabilityScore: number
  coverageScore: number
  total: number
  grade: string
  color: string
  bgColor: string
  shadowColor: string
  description: string
}

export function HealthScore({ data, previousErrorCount }: HealthScoreProps) {
  const score = useMemo((): ScoreBreakdown => {
    if (!data || data.length === 0) {
      return {
        errorScore: 0,
        availabilityScore: 0,
        coverageScore: 0,
        total: 0,
        grade: 'N/A',
        color: 'text-gray-500',
        bgColor: 'from-gray-400 to-gray-500',
        shadowColor: 'shadow-gray-500/30',
        description: 'No data available'
      }
    }

    // Calculate error score (0-40 points) - fewer errors = higher score
    const errorRate = data.filter(r => r.hasError).length / data.length
    const errorScore = Math.round((1 - errorRate) * 40)

    // Calculate availability score (0-40 points) - lower days out = higher score
    const rowsWithDaysOut = data.filter(r => r.daysOut !== null)
    let availabilityScore = 20 // Default middle score
    if (rowsWithDaysOut.length > 0) {
      const avgDaysOut = rowsWithDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / rowsWithDaysOut.length
      // Score based on average days out (0-7 days = excellent, 30+ = poor)
      if (avgDaysOut <= 7) availabilityScore = 40
      else if (avgDaysOut <= 14) availabilityScore = 35
      else if (avgDaysOut <= 21) availabilityScore = 28
      else if (avgDaysOut <= 30) availabilityScore = 20
      else if (avgDaysOut <= 45) availabilityScore = 12
      else availabilityScore = 5
    }

    // Calculate coverage score (0-20 points) - having data for all categories
    const uniqueCategories = new Set(data.map(r => r.raw['Category'] || '').filter(Boolean))
    const coverageScore = Math.min(20, uniqueCategories.size * 2)

    const total = errorScore + availabilityScore + coverageScore

    // Determine grade
    let grade: string
    let color: string
    let bgColor: string
    let shadowColor: string
    let description: string

    if (total >= 90) {
      grade = 'A+'
      color = 'text-emerald-500'
      bgColor = 'from-emerald-400 to-green-500'
      shadowColor = 'shadow-emerald-500/50'
      description = 'Excellent! All systems performing optimally.'
    } else if (total >= 80) {
      grade = 'A'
      color = 'text-emerald-500'
      bgColor = 'from-emerald-400 to-teal-500'
      shadowColor = 'shadow-emerald-500/40'
      description = 'Great performance with minimal issues.'
    } else if (total >= 70) {
      grade = 'B'
      color = 'text-blue-500'
      bgColor = 'from-blue-400 to-cyan-500'
      shadowColor = 'shadow-blue-500/40'
      description = 'Good overall, minor improvements possible.'
    } else if (total >= 60) {
      grade = 'C'
      color = 'text-amber-500'
      bgColor = 'from-amber-400 to-yellow-500'
      shadowColor = 'shadow-amber-500/40'
      description = 'Average performance, attention needed.'
    } else if (total >= 50) {
      grade = 'D'
      color = 'text-orange-500'
      bgColor = 'from-orange-400 to-red-400'
      shadowColor = 'shadow-orange-500/40'
      description = 'Below average, action recommended.'
    } else {
      grade = 'F'
      color = 'text-red-500'
      bgColor = 'from-red-400 to-rose-500'
      shadowColor = 'shadow-red-500/40'
      description = 'Critical issues detected, immediate action required.'
    }

    return { errorScore, availabilityScore, coverageScore, total, grade, color, bgColor, shadowColor, description }
  }, [data])

  const currentErrorCount = data.filter(r => r.hasError).length
  const errorTrend = previousErrorCount !== undefined 
    ? currentErrorCount - previousErrorCount 
    : null

  return (
    <Card className="glass border-2 border-purple-200/50 dark:border-purple-800/50 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500" />
          <span className="text-gradient-primary">System Health Score</span>
        </CardTitle>
        <CardDescription>{score.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Main Grade Circle */}
          <Tooltip>
            <TooltipTrigger>
              <div className={cn(
                "relative w-28 h-28 rounded-full flex items-center justify-center",
                "bg-gradient-to-br shadow-2xl transition-transform hover:scale-105",
                score.bgColor,
                score.shadowColor
              )}>
                {/* Outer ring */}
                <div className="absolute inset-1 rounded-full bg-card/90 flex items-center justify-center">
                  <div className="text-center">
                    <div className={cn("text-4xl font-black", score.color)}>
                      {score.grade}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {score.total}/100
                    </div>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px]">
              <p className="font-semibold mb-1">Health Score Breakdown</p>
              <p className="text-xs text-muted-foreground">
                Based on error rate, average wait time, and data coverage.
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Score Breakdown */}
          <div className="flex-1 space-y-3">
            <ScoreBar 
              label="Error-Free Rate" 
              value={score.errorScore} 
              max={40} 
              color="from-emerald-400 to-green-500"
              icon={score.errorScore >= 35 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            />
            <ScoreBar 
              label="Availability" 
              value={score.availabilityScore} 
              max={40} 
              color="from-blue-400 to-cyan-500"
              icon={<Activity className="h-3.5 w-3.5 text-blue-500" />}
            />
            <ScoreBar 
              label="Coverage" 
              value={score.coverageScore} 
              max={20} 
              color="from-purple-400 to-pink-500"
              icon={<CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />}
            />
          </div>

          {/* Error Trend */}
          {errorTrend !== null && (
            <div className="text-center px-4 border-l">
              <div className="text-xs text-muted-foreground mb-1">Errors</div>
              <div className={cn(
                "flex items-center justify-center gap-1 text-lg font-bold",
                errorTrend > 0 ? "text-red-500" : errorTrend < 0 ? "text-emerald-500" : "text-muted-foreground"
              )}>
                {errorTrend > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : errorTrend < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : null}
                {errorTrend > 0 ? '+' : ''}{errorTrend}
              </div>
              <div className="text-xs text-muted-foreground">vs last</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ScoreBar({ 
  label, 
  value, 
  max, 
  color,
  icon
}: { 
  label: string
  value: number
  max: number
  color: string
  icon?: React.ReactNode
}) {
  const percentage = (value / max) * 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-semibold">{value}/{max}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

