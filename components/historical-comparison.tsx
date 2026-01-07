'use client'

import { useMemo } from 'react'
import { TrendingDown, Trophy, AlertTriangle, Sparkles, ExternalLink, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HistoricalComparisonProps {
  data: ParsedSheetRow[]
}

interface LinkSummary {
  name: string
  location: string
  url: string
  daysOut: number
  categoryType: string
}

export function HistoricalComparison({ data }: HistoricalComparisonProps) {
  // Get links with valid days out data
  const linksWithData = useMemo((): LinkSummary[] => {
    return data
      .filter(row => row.daysOut !== null)
      .map(row => ({
        name: row.raw['Name'] || 'Unknown',
        location: row.raw['Location'] || 'Unknown',
        url: row.raw['URL'] || '',
        daysOut: row.daysOut!,
        categoryType: row.categoryType,
      }))
  }, [data])

  // Get top 10 best performers (shortest wait times)
  const topPerformers = useMemo(() => {
    return [...linksWithData]
      .sort((a, b) => a.daysOut - b.daysOut) // Lowest days out first
      .slice(0, 10)
  }, [linksWithData])

  // Get top 10 longest wait times (needs attention)
  const needsAttention = useMemo(() => {
    return [...linksWithData]
      .sort((a, b) => b.daysOut - a.daysOut) // Highest days out first
      .slice(0, 10)
  }, [linksWithData])

  // Summary stats
  const summaryStats = useMemo(() => {
    if (linksWithData.length === 0) {
      return { excellent: 0, good: 0, fair: 0, poor: 0, avgDaysOut: 0 }
    }
    
    const excellent = linksWithData.filter(l => l.daysOut < 2).length
    const good = linksWithData.filter(l => l.daysOut >= 2 && l.daysOut < 4).length
    const fair = linksWithData.filter(l => l.daysOut >= 4 && l.daysOut < 7).length
    const poor = linksWithData.filter(l => l.daysOut >= 7).length
    const avgDaysOut = linksWithData.reduce((sum, l) => sum + l.daysOut, 0) / linksWithData.length
    
    return { excellent, good, fair, poor, avgDaysOut }
  }, [linksWithData])

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
                <span className="text-gradient-primary">Daily Summary</span>
              </CardTitle>
              <CardDescription>{today}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-2xl font-bold text-emerald-400">{summaryStats.excellent}</div>
              <div className="text-xs text-muted-foreground">&lt;2 days</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-400">{summaryStats.good}</div>
              <div className="text-xs text-muted-foreground">2-4 days</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="text-2xl font-bold text-orange-400">{summaryStats.fair}</div>
              <div className="text-xs text-muted-foreground">4-7 days</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">{summaryStats.poor}</div>
              <div className="text-xs text-muted-foreground">7+ days</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="text-2xl font-bold text-purple-400">
                {summaryStats.avgDaysOut.toFixed(1)}d
              </div>
              <div className="text-xs text-muted-foreground">Average</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two columns: Best and Worst */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Performers (Shortest Wait Times) */}
        <Card className="glass border-emerald-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-500" />
              <span className="text-emerald-400">Top 10 Best Availability</span>
            </CardTitle>
            <CardDescription>Shortest wait times</CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <div className="space-y-2">
                {topPerformers.map((link, idx) => (
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
                        <Badge className={cn(
                          "font-semibold",
                          link.daysOut < 2 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                          link.daysOut < 4 ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                          "bg-orange-500/20 text-orange-400 border-orange-500/30"
                        )}>
                          {link.daysOut} days
                        </Badge>
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
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Needs Attention (Longest Wait Times) */}
        <Card className="glass border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-red-400">Top 10 Needs Attention</span>
            </CardTitle>
            <CardDescription>Longest wait times</CardDescription>
          </CardHeader>
          <CardContent>
            {needsAttention.length > 0 ? (
              <div className="space-y-2">
                {needsAttention.map((link, idx) => (
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
                        <Badge className={cn(
                          "font-semibold",
                          link.daysOut >= 7 ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          link.daysOut >= 4 ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                          "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        )}>
                          {link.daysOut} days
                        </Badge>
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
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
