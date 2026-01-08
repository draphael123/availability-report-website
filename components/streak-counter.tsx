'use client'

import { useMemo } from 'react'
import { Flame, Trophy, Zap, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ParsedSheetRow } from '@/lib/types'

interface StreakCounterProps {
  data: ParsedSheetRow[]
  errorCount: number
}

export function StreakCounter({ data, errorCount }: StreakCounterProps) {
  // Calculate various streaks
  const stats = useMemo(() => {
    const totalLinks = data.length
    const successfulLinks = data.filter(r => !r.hasError).length
    const successRate = totalLinks > 0 ? Math.round((successfulLinks / totalLinks) * 100) : 0

    // Calculate "perfect" status (error rate under 5%)
    const isPerfect = errorCount === 0
    const isGood = successRate >= 95
    const isOkay = successRate >= 80

    // Days since deployment (simulated - in real app would track actual days)
    const deployDate = new Date('2026-01-01')
    const today = new Date()
    const daysSinceDeployment = Math.floor((today.getTime() - deployDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      totalLinks,
      successfulLinks,
      errorCount,
      successRate,
      isPerfect,
      isGood,
      isOkay,
      daysSinceDeployment,
    }
  }, [data, errorCount])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Error-Free Streak */}
      <Card className={cn(
        "glass overflow-hidden transition-all duration-300",
        stats.isPerfect 
          ? "border-2 border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-500/20" 
          : "border-border"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl transition-all",
              stats.isPerfect 
                ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/40 animate-pulse"
                : stats.isGood
                ? "bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg shadow-blue-500/30"
                : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30"
            )}>
              {stats.isPerfect ? (
                <Trophy className="h-5 w-5 text-white" />
              ) : stats.isGood ? (
                <Flame className="h-5 w-5 text-white" />
              ) : (
                <Zap className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <div className={cn(
                "text-2xl font-black",
                stats.isPerfect 
                  ? "text-emerald-500" 
                  : stats.isGood 
                  ? "text-blue-500"
                  : "text-amber-500"
              )}>
                {stats.isPerfect ? '🎉 0' : stats.errorCount}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.isPerfect ? 'Zero Errors!' : 'Current Errors'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card className="glass overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl shadow-lg",
              stats.successRate >= 95 
                ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30"
                : stats.successRate >= 80
                ? "bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-500/30"
                : "bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-500/30"
            )}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className={cn(
                "text-2xl font-black",
                stats.successRate >= 95 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
                  : stats.successRate >= 80
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
              )}>
                {stats.successRate}%
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Links */}
      <Card className="glass overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg shadow-purple-500/30">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-black text-gradient-primary">
                {stats.totalLinks}
              </div>
              <div className="text-xs text-muted-foreground">Links Monitored</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Days Active */}
      <Card className="glass overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                {stats.daysSinceDeployment}
              </div>
              <div className="text-xs text-muted-foreground">Days Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




