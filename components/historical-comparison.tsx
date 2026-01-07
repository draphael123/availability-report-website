'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Trophy, AlertTriangle, Sparkles, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HistoricalComparisonProps {
  data: ParsedSheetRow[]
}

interface LinkChange {
  name: string
  location: string
  url: string
  currentDaysOut: number
  previousDaysOut: number
  change: number
  changePercent: number
  categoryType: string
}

export function HistoricalComparison({ data }: HistoricalComparisonProps) {
  // Generate simulated daily changes based on current data
  const dailyChanges = useMemo((): LinkChange[] => {
    return data
      .filter(row => row.daysOut !== null)
      .map(row => {
        const name = row.raw['Name'] || 'Unknown'
        const location = row.raw['Location'] || 'Unknown'
        const url = row.raw['URL'] || ''
        const currentDaysOut = row.daysOut!
        
        // Simulate previous day's value with realistic variation
        // Some links improve, some worsen, some stay similar
        const changeRange = Math.max(1, Math.floor(currentDaysOut * 0.3)) // Up to 30% change
        const simulatedChange = Math.floor(Math.random() * changeRange * 2) - changeRange
        const previousDaysOut = Math.max(1, currentDaysOut - simulatedChange)
        const change = currentDaysOut - previousDaysOut
        const changePercent = previousDaysOut > 0 
          ? Math.round((change / previousDaysOut) * 100)
          : 0
        
        return {
          name,
          location,
          url,
          currentDaysOut,
          previousDaysOut,
          change,
          changePercent,
          categoryType: row.categoryType,
        }
      })
  }, [data])

  // Get top 10 improvements (biggest decrease in days out)
  const topImprovements = useMemo(() => {
    return [...dailyChanges]
      .filter(c => c.change < 0)
      .sort((a, b) => a.change - b.change) // Most negative first
      .slice(0, 10)
  }, [dailyChanges])

  // Get top 10 declines (biggest increase in days out)
  const topDeclines = useMemo(() => {
    return [...dailyChanges]
      .filter(c => c.change > 0)
      .sort((a, b) => b.change - a.change) // Most positive first
      .slice(0, 10)
  }, [dailyChanges])

  // Summary stats
  const summaryStats = useMemo(() => {
    const improving = dailyChanges.filter(c => c.change < 0).length
    const declining = dailyChanges.filter(c => c.change > 0).length
    const stable = dailyChanges.filter(c => c.change === 0).length
    const avgChange = dailyChanges.length > 0
      ? dailyChanges.reduce((sum, c) => sum + c.change, 0) / dailyChanges.length
      : 0
    
    return { improving, declining, stable, avgChange }
  }, [dailyChanges])

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="space-y-6">
      {/* Header with summary */}
      <Card className="glass border-purple-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span className="text-gradient-primary">Daily Changes Summary</span>
              </CardTitle>
              <CardDescription>{today}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              Simulated
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-2xl font-bold text-emerald-400">{summaryStats.improving}</div>
              <div className="text-xs text-muted-foreground">Improved</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">{summaryStats.declining}</div>
              <div className="text-xs text-muted-foreground">Declined</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-400">{summaryStats.stable}</div>
              <div className="text-xs text-muted-foreground">Stable</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className={cn(
                "text-2xl font-bold",
                summaryStats.avgChange < 0 ? "text-emerald-400" : summaryStats.avgChange > 0 ? "text-red-400" : "text-purple-400"
              )}>
                {summaryStats.avgChange > 0 ? '+' : ''}{summaryStats.avgChange.toFixed(1)}d
              </div>
              <div className="text-xs text-muted-foreground">Avg Change</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two columns: Wins and Losses */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Improvements (Wins) */}
        <Card className="glass border-emerald-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-500" />
              <span className="text-emerald-400">Top 10 Wins</span>
            </CardTitle>
            <CardDescription>Biggest improvements in wait time</CardDescription>
          </CardHeader>
          <CardContent>
            {topImprovements.length > 0 ? (
              <div className="space-y-2">
                {topImprovements.map((link, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-lg font-bold text-emerald-400 w-6">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate" title={link.name}>
                          {link.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{link.location}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              link.categoryType === 'HRT' && "text-pink-400 border-pink-400/30",
                              link.categoryType === 'TRT' && "text-blue-400 border-blue-400/30",
                              link.categoryType === 'Provider' && "text-purple-400 border-purple-400/30"
                            )}
                          >
                            {link.categoryType === 'all' ? 'Other' : link.categoryType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <TrendingDown className="h-4 w-4" />
                          {link.change}d
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {link.previousDaysOut}d → {link.currentDaysOut}d
                        </div>
                      </div>
                      {link.url && (
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-emerald-400 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No improvements today
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Declines (Losses) */}
        <Card className="glass border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-red-400">Top 10 Needs Attention</span>
            </CardTitle>
            <CardDescription>Biggest increases in wait time</CardDescription>
          </CardHeader>
          <CardContent>
            {topDeclines.length > 0 ? (
              <div className="space-y-2">
                {topDeclines.map((link, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-lg font-bold text-red-400 w-6">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate" title={link.name}>
                          {link.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{link.location}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              link.categoryType === 'HRT' && "text-pink-400 border-pink-400/30",
                              link.categoryType === 'TRT' && "text-blue-400 border-blue-400/30",
                              link.categoryType === 'Provider' && "text-purple-400 border-purple-400/30"
                            )}
                          >
                            {link.categoryType === 'all' ? 'Other' : link.categoryType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-red-400 font-semibold">
                          <TrendingUp className="h-4 w-4" />
                          +{link.change}d
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {link.previousDaysOut}d → {link.currentDaysOut}d
                        </div>
                      </div>
                      {link.url && (
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No declines today - great news!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
