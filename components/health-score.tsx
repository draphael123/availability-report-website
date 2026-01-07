'use client'

import { useMemo } from 'react'
import { Calendar, TrendingUp, TrendingDown, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ParsedSheetRow } from '@/lib/types'

interface HealthScoreProps {
  data: ParsedSheetRow[]
  previousErrorCount?: number
}

interface AvailabilityBreakdown {
  within2Days: number
  within7Days: number
  within14Days: number
  within30Days: number
  over30Days: number
  noData: number
  total: number
  availabilityRate: number
  grade: string
  color: string
  bgColor: string
  shadowColor: string
  description: string
}

export function HealthScore({ data }: HealthScoreProps) {
  const availability = useMemo((): AvailabilityBreakdown => {
    if (!data || data.length === 0) {
      return {
        within2Days: 0,
        within7Days: 0,
        within14Days: 0,
        within30Days: 0,
        over30Days: 0,
        noData: 0,
        total: 0,
        availabilityRate: 0,
        grade: 'N/A',
        color: 'text-gray-500',
        bgColor: 'from-gray-400 to-gray-500',
        shadowColor: 'shadow-gray-500/30',
        description: 'No data available'
      }
    }

    const total = data.length
    
    // Count links by availability window
    let within2Days = 0
    let within7Days = 0
    let within14Days = 0
    let within30Days = 0
    let over30Days = 0
    let noData = 0

    data.forEach(row => {
      if (row.daysOut === null || row.hasError) {
        noData++
      } else if (row.daysOut <= 2) {
        within2Days++
      } else if (row.daysOut <= 7) {
        within7Days++
      } else if (row.daysOut <= 14) {
        within14Days++
      } else if (row.daysOut <= 30) {
        within30Days++
      } else {
        over30Days++
      }
    })

    // Calculate availability rate (links available within 2-7 days)
    const availableLinks = within2Days + within7Days
    const validLinks = total - noData
    const availabilityRate = validLinks > 0 
      ? Math.round((availableLinks / validLinks) * 100) 
      : 0

    // Determine grade based on 2-7 day availability
    let grade: string
    let color: string
    let bgColor: string
    let shadowColor: string
    let description: string

    if (availabilityRate >= 90) {
      grade = 'A+'
      color = 'text-emerald-500'
      bgColor = 'from-emerald-400 to-green-500'
      shadowColor = 'shadow-emerald-500/50'
      description = 'Excellent! Most appointments available within a week.'
    } else if (availabilityRate >= 80) {
      grade = 'A'
      color = 'text-emerald-500'
      bgColor = 'from-emerald-400 to-teal-500'
      shadowColor = 'shadow-emerald-500/40'
      description = 'Great availability with quick booking options.'
    } else if (availabilityRate >= 70) {
      grade = 'B'
      color = 'text-blue-500'
      bgColor = 'from-blue-400 to-cyan-500'
      shadowColor = 'shadow-blue-500/40'
      description = 'Good availability, most links under a week.'
    } else if (availabilityRate >= 60) {
      grade = 'C'
      color = 'text-amber-500'
      bgColor = 'from-amber-400 to-yellow-500'
      shadowColor = 'shadow-amber-500/40'
      description = 'Moderate availability, some longer wait times.'
    } else if (availabilityRate >= 40) {
      grade = 'D'
      color = 'text-orange-500'
      bgColor = 'from-orange-400 to-red-400'
      shadowColor = 'shadow-orange-500/40'
      description = 'Limited availability within a week.'
    } else {
      grade = 'F'
      color = 'text-red-500'
      bgColor = 'from-red-400 to-rose-500'
      shadowColor = 'shadow-red-500/40'
      description = 'Poor availability, most links have long wait times.'
    }

    return { 
      within2Days, 
      within7Days, 
      within14Days, 
      within30Days, 
      over30Days, 
      noData,
      total,
      availabilityRate, 
      grade, 
      color, 
      bgColor, 
      shadowColor, 
      description 
    }
  }, [data])

  return (
    <Card className="glass border-2 border-purple-200/50 dark:border-purple-800/50 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          <span className="text-gradient-primary">Overall Availability</span>
        </CardTitle>
        <CardDescription>{availability.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Main Grade Circle */}
          <Tooltip>
            <TooltipTrigger>
              <div className={cn(
                "relative w-28 h-28 rounded-full flex items-center justify-center",
                "bg-gradient-to-br shadow-2xl transition-transform hover:scale-105",
                availability.bgColor,
                availability.shadowColor
              )}>
                {/* Outer ring */}
                <div className="absolute inset-1 rounded-full bg-card/90 flex items-center justify-center">
                  <div className="text-center">
                    <div className={cn("text-4xl font-black", availability.color)}>
                      {availability.grade}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {availability.availabilityRate}% in 7d
                    </div>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[220px]">
              <p className="font-semibold mb-1">Availability Score</p>
              <p className="text-xs text-muted-foreground">
                Percentage of links with appointments available within 2-7 days. Higher is better!
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Availability Breakdown */}
          <div className="flex-1 space-y-2">
            <AvailabilityBar 
              label="Within 2 days" 
              count={availability.within2Days}
              total={availability.total - availability.noData}
              color="from-emerald-400 to-green-500"
              icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            />
            <AvailabilityBar 
              label="3-7 days" 
              count={availability.within7Days}
              total={availability.total - availability.noData}
              color="from-blue-400 to-cyan-500"
              icon={<Clock className="h-3.5 w-3.5 text-blue-500" />}
            />
            <AvailabilityBar 
              label="8-14 days" 
              count={availability.within14Days}
              total={availability.total - availability.noData}
              color="from-amber-400 to-yellow-500"
              icon={<Clock className="h-3.5 w-3.5 text-amber-500" />}
            />
            <AvailabilityBar 
              label="15-30 days" 
              count={availability.within30Days}
              total={availability.total - availability.noData}
              color="from-orange-400 to-red-400"
              icon={<Clock className="h-3.5 w-3.5 text-orange-500" />}
            />
            <AvailabilityBar 
              label="30+ days" 
              count={availability.over30Days}
              total={availability.total - availability.noData}
              color="from-red-400 to-rose-500"
              icon={<Clock className="h-3.5 w-3.5 text-red-500" />}
            />
          </div>

          {/* Quick Stats */}
          <div className="text-center px-4 border-l space-y-3">
            <div>
              <div className="text-2xl font-bold text-gradient-primary">
                {availability.within2Days + availability.within7Days}
              </div>
              <div className="text-xs text-muted-foreground">Available<br/>in 7 days</div>
            </div>
            <div>
              <div className={cn(
                "text-lg font-bold",
                availability.noData > 0 ? "text-amber-500" : "text-emerald-500"
              )}>
                {availability.noData}
              </div>
              <div className="text-xs text-muted-foreground">No data<br/>or errors</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AvailabilityBar({ 
  label, 
  count, 
  total, 
  color,
  icon
}: { 
  label: string
  count: number
  total: number
  color: string
  icon?: React.ReactNode
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-semibold">{count} <span className="text-muted-foreground font-normal">({percentage.toFixed(0)}%)</span></span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
