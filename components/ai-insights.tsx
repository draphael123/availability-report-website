'use client'

import { useMemo } from 'react'
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Zap,
  Target,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ParsedSheetRow, CategoryType } from '@/lib/types'

interface AIInsightsProps {
  data: ParsedSheetRow[]
  categoryType: CategoryType
}

interface Insight {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  icon: React.ReactNode
  title: string
  description: string
  metric?: string
  action?: string
}

export function AIInsights({ data, categoryType }: AIInsightsProps) {
  const insights = useMemo((): Insight[] => {
    if (!data || data.length === 0) return []

    const results: Insight[] = []
    const categoryLabel = categoryType === 'all' ? 'All links' : `${categoryType} links`

    // Calculate basic stats
    const totalRows = data.length
    const errorCount = data.filter(r => r.hasError).length
    const errorRate = (errorCount / totalRows) * 100
    const rowsWithDaysOut = data.filter(r => r.daysOut !== null)
    const avgDaysOut = rowsWithDaysOut.length > 0
      ? rowsWithDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / rowsWithDaysOut.length
      : null

    // Category breakdown
    const hrtRows = data.filter(r => r.categoryType === 'HRT')
    const trtRows = data.filter(r => r.categoryType === 'TRT')
    const providerRows = data.filter(r => r.categoryType === 'Provider')

    // Calculate category averages
    const getAvgDaysOut = (rows: ParsedSheetRow[]) => {
      const withDays = rows.filter(r => r.daysOut !== null)
      return withDays.length > 0
        ? withDays.reduce((sum, r) => sum + r.daysOut!, 0) / withDays.length
        : null
    }

    const hrtAvg = getAvgDaysOut(hrtRows)
    const trtAvg = getAvgDaysOut(trtRows)
    const providerAvg = getAvgDaysOut(providerRows)

    // Error rate insight
    if (errorRate === 0) {
      results.push({
        id: 'perfect-errors',
        type: 'positive',
        icon: <CheckCircle2 className="h-4 w-4" />,
        title: 'Perfect Error Rate! 🎉',
        description: `${categoryLabel} have zero errors. All scheduling links are working correctly.`,
        metric: '0%',
      })
    } else if (errorRate < 5) {
      results.push({
        id: 'low-errors',
        type: 'positive',
        icon: <TrendingDown className="h-4 w-4" />,
        title: 'Low Error Rate',
        description: `Only ${errorCount} out of ${totalRows} links have errors.`,
        metric: `${errorRate.toFixed(1)}%`,
      })
    } else if (errorRate > 15) {
      results.push({
        id: 'high-errors',
        type: 'warning',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'High Error Rate Detected',
        description: `${errorCount} links are experiencing errors. Consider investigating.`,
        metric: `${errorRate.toFixed(1)}%`,
        action: 'Filter by "Errors only" to see affected links',
      })
    }

    // Availability insight
    if (avgDaysOut !== null) {
      if (avgDaysOut <= 7) {
        results.push({
          id: 'great-availability',
          type: 'positive',
          icon: <Zap className="h-4 w-4" />,
          title: 'Excellent Availability',
          description: 'Average wait time is under a week. Patients can book soon!',
          metric: `${avgDaysOut.toFixed(1)} days`,
        })
      } else if (avgDaysOut > 30) {
        results.push({
          id: 'long-wait',
          type: 'warning',
          icon: <Clock className="h-4 w-4" />,
          title: 'Long Wait Times',
          description: 'Average appointment wait is over a month. May need capacity review.',
          metric: `${avgDaysOut.toFixed(1)} days`,
          action: 'Sort by "Days Out" to find bottlenecks',
        })
      }
    }

    // Category comparison insights
    if (categoryType === 'all' && hrtAvg !== null && trtAvg !== null) {
      const diff = Math.abs(hrtAvg - trtAvg)
      if (diff > 10) {
        const betterCategory = hrtAvg < trtAvg ? 'HRT' : 'TRT'
        const worseCategory = hrtAvg < trtAvg ? 'TRT' : 'HRT'
        const worseAvg = hrtAvg < trtAvg ? trtAvg : hrtAvg
        
        results.push({
          id: 'category-diff',
          type: 'neutral',
          icon: <Target className="h-4 w-4" />,
          title: `${betterCategory} is Outperforming`,
          description: `${betterCategory} links have ${diff.toFixed(0)} fewer days out on average than ${worseCategory}.`,
          metric: `${worseAvg.toFixed(1)} days (${worseCategory})`,
          action: `Filter to ${worseCategory} to investigate`,
        })
      }
    }

    // Best performing category
    const categoryAvgs = [
      { name: 'HRT', avg: hrtAvg, count: hrtRows.length },
      { name: 'TRT', avg: trtAvg, count: trtRows.length },
      { name: 'Provider', avg: providerAvg, count: providerRows.length },
    ].filter(c => c.avg !== null && c.count > 0)

    if (categoryAvgs.length > 1) {
      const best = categoryAvgs.reduce((a, b) => (a.avg! < b.avg! ? a : b))
      if (best.avg! <= 14) {
        results.push({
          id: 'best-category',
          type: 'positive',
          icon: <TrendingUp className="h-4 w-4" />,
          title: `${best.name} Leading Performance`,
          description: `${best.name} has the best average wait time across ${best.count} links.`,
          metric: `${best.avg!.toFixed(1)} days avg`,
        })
      }
    }

    // Provider specific insight
    if (providerRows.length > 0) {
      const providerErrors = providerRows.filter(r => r.hasError).length
      const providerErrorRate = (providerErrors / providerRows.length) * 100
      
      if (providerErrorRate > errorRate + 5) {
        results.push({
          id: 'provider-errors',
          type: 'warning',
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Provider Links Need Attention',
          description: `Provider links have a ${providerErrorRate.toFixed(1)}% error rate, higher than average.`,
          action: 'Filter to Provider to review issues',
        })
      }
    }

    // Coverage insight
    const uniqueCategories = new Set(data.map(r => r.raw['Category']).filter(Boolean))
    if (uniqueCategories.size >= 10) {
      results.push({
        id: 'good-coverage',
        type: 'positive',
        icon: <CheckCircle2 className="h-4 w-4" />,
        title: 'Comprehensive Coverage',
        description: `Monitoring ${uniqueCategories.size} different categories across ${totalRows} links.`,
        metric: `${uniqueCategories.size} categories`,
      })
    }

    // Limit to top 4 insights
    return results.slice(0, 4)
  }, [data, categoryType])

  if (insights.length === 0) {
    return null
  }

  const typeStyles: Record<Insight['type'], { bg: string; border: string; icon: string }> = {
    positive: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: 'text-emerald-500',
    },
    negative: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: 'text-red-500',
    },
    neutral: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: 'text-blue-500',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: 'text-amber-500',
    },
  }

  return (
    <Card className="glass border-2 border-purple-200/50 dark:border-purple-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-gradient-primary">AI-Powered Insights</span>
          <Badge variant="outline" className="ml-auto text-xs font-normal">
            {insights.length} insights
          </Badge>
        </CardTitle>
        <CardDescription>
          Automatically generated observations from your data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight) => {
            const styles = typeStyles[insight.type]
            return (
              <div
                key={insight.id}
                className={cn(
                  "p-3 rounded-xl border transition-all duration-200 hover:shadow-md",
                  styles.bg,
                  styles.border
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5", styles.icon)}>
                    {insight.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">
                        {insight.title}
                      </span>
                      {insight.metric && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {insight.metric}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <p className="text-xs text-primary mt-1.5 flex items-center gap-1 font-medium">
                        <ArrowRight className="h-3 w-3" />
                        {insight.action}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}



