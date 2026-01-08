'use client'

import { useMemo } from 'react'
import { 
  Calendar, 
  CalendarDays, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Target,
  Award,
  BarChart3,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DataSummariesProps {
  data: ParsedSheetRow[]
  categoryType: string
}

interface LinkSummary {
  name: string
  location: string
  daysOut: number
  url: string
  categoryType: string
}

export function DataSummaries({ data, categoryType }: DataSummariesProps) {
  // Filter by category type
  const filteredData = useMemo(() => {
    if (categoryType === 'all') return data
    return data.filter(row => row.categoryType === categoryType)
  }, [data, categoryType])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const withDaysOut = filteredData.filter(r => r.daysOut !== null)
    const sortedByDays = [...withDaysOut].sort((a, b) => a.daysOut! - b.daysOut!)
    
    // Soonest (lowest days out)
    const soonest5: LinkSummary[] = sortedByDays.slice(0, 5).map(r => ({
      name: r.raw['Name'] || 'Unknown',
      location: r.raw['Location'] || 'Unknown',
      daysOut: r.daysOut!,
      url: r.raw['URL'] || '',
      categoryType: r.categoryType,
    }))

    // Furthest (highest days out)
    const furthest5: LinkSummary[] = sortedByDays.slice(-5).reverse().map(r => ({
      name: r.raw['Name'] || 'Unknown',
      location: r.raw['Location'] || 'Unknown',
      daysOut: r.daysOut!,
      url: r.raw['URL'] || '',
      categoryType: r.categoryType,
    }))

    // Calculate averages and counts
    const totalLinks = filteredData.length
    const linksWithData = withDaysOut.length
    const avgDaysOut = linksWithData > 0 
      ? withDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / linksWithData 
      : 0
    const medianDaysOut = linksWithData > 0 
      ? sortedByDays[Math.floor(linksWithData / 2)].daysOut! 
      : 0

    const errorCount = filteredData.filter(r => r.hasError).length
    const errorRate = totalLinks > 0 ? (errorCount / totalLinks) * 100 : 0

    // Distribution buckets
    const under2 = withDaysOut.filter(r => r.daysOut! < 2).length
    const under4 = withDaysOut.filter(r => r.daysOut! >= 2 && r.daysOut! < 4).length
    const under7 = withDaysOut.filter(r => r.daysOut! >= 4 && r.daysOut! < 7).length
    const over7 = withDaysOut.filter(r => r.daysOut! >= 7).length

    // By category breakdown
    const hrtLinks = filteredData.filter(r => r.categoryType === 'HRT')
    const trtLinks = filteredData.filter(r => r.categoryType === 'TRT')
    const providerLinks = filteredData.filter(r => r.categoryType === 'Provider')

    const hrtAvg = hrtLinks.filter(r => r.daysOut !== null).length > 0
      ? hrtLinks.filter(r => r.daysOut !== null).reduce((s, r) => s + r.daysOut!, 0) / hrtLinks.filter(r => r.daysOut !== null).length
      : null
    const trtAvg = trtLinks.filter(r => r.daysOut !== null).length > 0
      ? trtLinks.filter(r => r.daysOut !== null).reduce((s, r) => s + r.daysOut!, 0) / trtLinks.filter(r => r.daysOut !== null).length
      : null
    const providerAvg = providerLinks.filter(r => r.daysOut !== null).length > 0
      ? providerLinks.filter(r => r.daysOut !== null).reduce((s, r) => s + r.daysOut!, 0) / providerLinks.filter(r => r.daysOut !== null).length
      : null

    // Simulated weekly comparison (would use real historical data if available)
    const weeklyChange = (Math.random() - 0.5) * 2 // Simulated: -1 to +1 days change

    return {
      soonest5,
      furthest5,
      totalLinks,
      linksWithData,
      avgDaysOut,
      medianDaysOut,
      errorCount,
      errorRate,
      under2,
      under4,
      under7,
      over7,
      hrtAvg,
      trtAvg,
      providerAvg,
      hrtCount: hrtLinks.length,
      trtCount: trtLinks.length,
      providerCount: providerLinks.length,
      weeklyChange,
    }
  }, [filteredData])

  const categoryLabel = categoryType === 'all' ? 'All Categories' : categoryType
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Daily Summary */}
      <Card className="glass border-purple-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <span className="text-gradient-primary">Daily Summary</span>
              </CardTitle>
              <CardDescription>{today} • {categoryLabel}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              Live Data
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
              <div className="text-3xl font-bold text-emerald-400">{summaryStats.avgDaysOut.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground mt-1">Avg Wait (days)</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <div className="text-3xl font-bold text-blue-400">{summaryStats.medianDaysOut}</div>
              <div className="text-xs text-muted-foreground mt-1">Median Wait</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
              <div className="text-3xl font-bold text-purple-400">{summaryStats.totalLinks}</div>
              <div className="text-xs text-muted-foreground mt-1">Links Monitored</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20">
              <div className="text-3xl font-bold text-pink-400">{summaryStats.errorRate.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground mt-1">Error Rate</div>
            </div>
          </div>

          {/* Distribution Bar */}
          <div>
            <div className="text-sm font-medium mb-2 text-muted-foreground">Wait Time Distribution</div>
            <div className="flex h-8 rounded-lg overflow-hidden">
              <div 
                className="bg-emerald-500 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${(summaryStats.under2 / summaryStats.linksWithData) * 100}%` }}
                title={`Under 2 days: ${summaryStats.under2}`}
              >
                {summaryStats.under2 > 0 && summaryStats.under2}
              </div>
              <div 
                className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${(summaryStats.under4 / summaryStats.linksWithData) * 100}%` }}
                title={`2-4 days: ${summaryStats.under4}`}
              >
                {summaryStats.under4 > 0 && summaryStats.under4}
              </div>
              <div 
                className="bg-orange-500 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${(summaryStats.under7 / summaryStats.linksWithData) * 100}%` }}
                title={`4-7 days: ${summaryStats.under7}`}
              >
                {summaryStats.under7 > 0 && summaryStats.under7}
              </div>
              <div 
                className="bg-red-500 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${(summaryStats.over7 / summaryStats.linksWithData) * 100}%` }}
                title={`7+ days: ${summaryStats.over7}`}
              >
                {summaryStats.over7 > 0 && summaryStats.over7}
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> &lt;2d</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500"></span> 2-4d</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-500"></span> 4-7d</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500"></span> 7+d</span>
            </div>
          </div>

          <Separator />

          {/* Soonest and Furthest */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Soonest Visits */}
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Soonest Available (Top 5)
              </h4>
              <div className="space-y-2">
                {summaryStats.soonest5.map((link, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-emerald-400 w-5">#{idx + 1}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate" title={link.name}>{link.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{link.location}</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shrink-0">
                      {link.daysOut}d
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Furthest Visits */}
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Furthest Out (Bottom 5)
              </h4>
              <div className="space-y-2">
                {summaryStats.furthest5.map((link, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-red-400 w-5">#{idx + 1}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate" title={link.name}>{link.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{link.location}</div>
                      </div>
                    </div>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 shrink-0">
                      {link.daysOut}d
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <Card className="glass border-blue-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                <span className="text-gradient-secondary">Weekly Summary</span>
              </CardTitle>
              <CardDescription>7-day overview • {categoryLabel}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              Simulated Trend
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weekly Change Indicator */}
          <div className="flex items-center justify-center gap-6 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Last Week Avg</div>
              <div className="text-2xl font-bold text-muted-foreground">
                {(summaryStats.avgDaysOut - summaryStats.weeklyChange).toFixed(1)}d
              </div>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <div className={cn(
                "text-sm font-semibold mt-1",
                summaryStats.weeklyChange < 0 ? "text-emerald-400" : summaryStats.weeklyChange > 0 ? "text-red-400" : "text-muted-foreground"
              )}>
                {summaryStats.weeklyChange > 0 ? '+' : ''}{summaryStats.weeklyChange.toFixed(1)}d
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">This Week Avg</div>
              <div className="text-2xl font-bold text-gradient-primary">
                {summaryStats.avgDaysOut.toFixed(1)}d
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Performance by Category</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 text-center">
                <div className="text-xs text-pink-400 font-medium mb-1">HRT</div>
                <div className="text-xl font-bold text-pink-400">
                  {summaryStats.hrtAvg !== null ? summaryStats.hrtAvg.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-muted-foreground">avg days • {summaryStats.hrtCount} links</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                <div className="text-xs text-blue-400 font-medium mb-1">TRT</div>
                <div className="text-xl font-bold text-blue-400">
                  {summaryStats.trtAvg !== null ? summaryStats.trtAvg.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-muted-foreground">avg days • {summaryStats.trtCount} links</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                <div className="text-xs text-purple-400 font-medium mb-1">Provider</div>
                <div className="text-xl font-bold text-purple-400">
                  {summaryStats.providerAvg !== null ? summaryStats.providerAvg.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-muted-foreground">avg days • {summaryStats.providerCount} links</div>
              </div>
            </div>
          </div>

          {/* Weekly Highlights */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Best Performer</span>
              </div>
              {summaryStats.soonest5[0] && (
                <>
                  <div className="text-sm font-semibold truncate" title={summaryStats.soonest5[0].name}>
                    {summaryStats.soonest5[0].name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {summaryStats.soonest5[0].daysOut} days wait
                  </div>
                </>
              )}
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Goal Progress</span>
              </div>
              <div className="text-sm font-semibold">
                {Math.round((summaryStats.under4 + summaryStats.under2) / summaryStats.linksWithData * 100)}% under 4 days
              </div>
              <div className="text-xs text-muted-foreground">
                {summaryStats.under4 + summaryStats.under2} of {summaryStats.linksWithData} links
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Needs Attention</span>
              </div>
              {summaryStats.furthest5[0] && (
                <>
                  <div className="text-sm font-semibold truncate" title={summaryStats.furthest5[0].name}>
                    {summaryStats.furthest5[0].name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {summaryStats.furthest5[0].daysOut} days wait
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">
                  <strong className="text-emerald-400">{summaryStats.under2}</strong> excellent (&lt;2d)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  <strong className="text-blue-400">{summaryStats.under4}</strong> good (2-4d)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm">
                  <strong className="text-red-400">{summaryStats.over7}</strong> need attention (7+d)
                </span>
              </div>
              {summaryStats.errorCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">
                    <strong>{summaryStats.errorCount}</strong> errors
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




