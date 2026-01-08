'use client'

import { useMemo } from 'react'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  TrendingUp,
  Zap,
  Target
} from 'lucide-react'
import { ParsedSheetRow, SummaryStats } from '@/lib/types'
import { cn } from '@/lib/utils'

interface QuickStatsBarProps {
  data: ParsedSheetRow[]
  stats: SummaryStats | null
}

export function QuickStatsBar({ data, stats }: QuickStatsBarProps) {
  const quickStats = useMemo(() => {
    if (!data || data.length === 0 || !stats) return null

    const withDaysOut = data.filter(r => r.daysOut !== null)
    const excellent = withDaysOut.filter(r => r.daysOut! < 2).length
    const good = withDaysOut.filter(r => r.daysOut! >= 2 && r.daysOut! < 4).length
    const warning = withDaysOut.filter(r => r.daysOut! >= 4 && r.daysOut! < 7).length
    const critical = withDaysOut.filter(r => r.daysOut! >= 7).length
    
    const excellentPct = withDaysOut.length > 0 ? (excellent / withDaysOut.length) * 100 : 0
    const goodPct = withDaysOut.length > 0 ? (good / withDaysOut.length) * 100 : 0
    const warningPct = withDaysOut.length > 0 ? (warning / withDaysOut.length) * 100 : 0
    const criticalPct = withDaysOut.length > 0 ? (critical / withDaysOut.length) * 100 : 0

    // Determine overall status
    let status: 'excellent' | 'good' | 'warning' | 'critical'
    if (excellentPct + goodPct >= 70 && stats.errorRate < 5) {
      status = 'excellent'
    } else if (excellentPct + goodPct >= 50 && stats.errorRate < 10) {
      status = 'good'
    } else if (criticalPct < 40 && stats.errorRate < 20) {
      status = 'warning'
    } else {
      status = 'critical'
    }

    return {
      excellent,
      good,
      warning,
      critical,
      excellentPct,
      goodPct,
      warningPct,
      criticalPct,
      status,
      totalMonitored: data.length,
      avgWait: stats.avgDaysOut,
      errorCount: stats.errorCount,
      errorRate: stats.errorRate,
    }
  }, [data, stats])

  if (!quickStats) return null

  const statusConfig = {
    excellent: {
      label: 'Excellent',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'from-emerald-500/20 to-emerald-500/5',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
    },
    good: {
      label: 'Good',
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'from-blue-500/20 to-blue-500/5',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/20',
    },
    warning: {
      label: 'Needs Attention',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'from-amber-500/20 to-amber-500/5',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20',
    },
    critical: {
      label: 'Critical',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'from-red-500/20 to-red-500/5',
      border: 'border-red-500/30',
      glow: 'shadow-red-500/20',
    },
  }

  const config = statusConfig[quickStats.status]
  const StatusIcon = config.icon

  return (
    <div className={cn(
      "rounded-xl p-4 border backdrop-blur-sm",
      "bg-gradient-to-r",
      config.bg,
      config.border,
      "shadow-lg",
      config.glow
    )}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Overall Status */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg bg-background/50",
            config.color
          )}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <div className={cn("text-lg font-bold", config.color)}>
              System Status: {config.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {quickStats.totalMonitored} links monitored • Updated in real-time
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-6">
          {/* Availability Distribution Mini Bar */}
          <div className="hidden md:block">
            <div className="text-xs text-muted-foreground mb-1">Wait Time Distribution</div>
            <div className="flex h-3 w-40 rounded-full overflow-hidden bg-muted/30">
              <div 
                className="bg-emerald-500 transition-all duration-500" 
                style={{ width: `${quickStats.excellentPct}%` }}
                title={`Excellent (<2d): ${quickStats.excellent}`}
              />
              <div 
                className="bg-blue-500 transition-all duration-500" 
                style={{ width: `${quickStats.goodPct}%` }}
                title={`Good (2-4d): ${quickStats.good}`}
              />
              <div 
                className="bg-amber-500 transition-all duration-500" 
                style={{ width: `${quickStats.warningPct}%` }}
                title={`Warning (4-7d): ${quickStats.warning}`}
              />
              <div 
                className="bg-red-500 transition-all duration-500" 
                style={{ width: `${quickStats.criticalPct}%` }}
                title={`Critical (7+d): ${quickStats.critical}`}
              />
            </div>
          </div>

          {/* Key Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-purple-400" />
              <span className="font-semibold text-purple-400">{quickStats.avgWait?.toFixed(1)}d</span>
              <span className="text-muted-foreground hidden sm:inline">avg</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-emerald-400">{quickStats.excellent + quickStats.good}</span>
              <span className="text-muted-foreground hidden sm:inline">&lt;4d</span>
            </div>

            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="font-semibold text-red-400">{quickStats.critical}</span>
              <span className="text-muted-foreground hidden sm:inline">7+d</span>
            </div>

            {quickStats.errorCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="font-semibold text-amber-400">{quickStats.errorCount}</span>
                <span className="text-muted-foreground hidden sm:inline">errors</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


