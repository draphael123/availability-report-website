'use client'

import { useMemo } from 'react'
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  MapPin,
  Tag,
  Clock,
  Zap,
  Award,
  Target,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParsedSheetRow, CategoryType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AutomatedInsightsProps {
  data: ParsedSheetRow[]
  categoryType?: CategoryType
}

interface Insight {
  id: string
  type: 'positive' | 'warning' | 'neutral' | 'action'
  icon: React.ReactNode
  title: string
  description: string
  metric?: string
  priority: number // 1-10, higher = more important
}

export function AutomatedInsights({ data, categoryType = 'all' }: AutomatedInsightsProps) {
  const insights = useMemo((): Insight[] => {
    const results: Insight[] = []
    
    // Filter data by category type if specified
    const filteredData = categoryType === 'all' 
      ? data 
      : data.filter(r => r.categoryType === categoryType)
    
    if (filteredData.length === 0) return results

    // Calculate key metrics
    const withDaysOut = filteredData.filter(r => r.daysOut !== null)
    const avgDaysOut = withDaysOut.length > 0
      ? withDaysOut.reduce((s, r) => s + r.daysOut!, 0) / withDaysOut.length
      : null
    
    const errorCount = filteredData.filter(r => r.hasError).length
    const errorRate = (errorCount / filteredData.length) * 100
    
    const excellentCount = withDaysOut.filter(r => r.daysOut! <= 2).length
    const excellentRate = withDaysOut.length > 0 ? (excellentCount / withDaysOut.length) * 100 : 0
    
    const criticalCount = withDaysOut.filter(r => r.daysOut! > 7).length
    const criticalRate = withDaysOut.length > 0 ? (criticalCount / withDaysOut.length) * 100 : 0

    // Group by location
    const byLocation = new Map<string, { count: number; avgDays: number; totalDays: number }>()
    withDaysOut.forEach(row => {
      const loc = row.raw['Location'] || 'Unknown'
      const existing = byLocation.get(loc) || { count: 0, avgDays: 0, totalDays: 0 }
      existing.count++
      existing.totalDays += row.daysOut!
      existing.avgDays = existing.totalDays / existing.count
      byLocation.set(loc, existing)
    })

    // Group by category
    const byCategory = new Map<string, { count: number; avgDays: number; totalDays: number }>()
    withDaysOut.forEach(row => {
      const cat = row.raw['Category'] || 'Unknown'
      const existing = byCategory.get(cat) || { count: 0, avgDays: 0, totalDays: 0 }
      existing.count++
      existing.totalDays += row.daysOut!
      existing.avgDays = existing.totalDays / existing.count
      byCategory.set(cat, existing)
    })

    // Find best and worst locations
    const locationEntries = Array.from(byLocation.entries()).filter(([_, v]) => v.count >= 2)
    const bestLocation = locationEntries.sort((a, b) => a[1].avgDays - b[1].avgDays)[0]
    const worstLocation = locationEntries.sort((a, b) => b[1].avgDays - a[1].avgDays)[0]

    // Find best and worst categories
    const categoryEntries = Array.from(byCategory.entries()).filter(([_, v]) => v.count >= 2)
    const bestCategory = categoryEntries.sort((a, b) => a[1].avgDays - b[1].avgDays)[0]
    const worstCategory = categoryEntries.sort((a, b) => b[1].avgDays - a[1].avgDays)[0]

    // === Generate Insights ===

    // 1. Overall health assessment
    if (avgDaysOut !== null) {
      if (avgDaysOut <= 3) {
        results.push({
          id: 'health-good',
          type: 'positive',
          icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
          title: 'Strong overall availability',
          description: `Average wait time is ${avgDaysOut.toFixed(1)} days, which is excellent for patient access.`,
          metric: `${avgDaysOut.toFixed(1)}d avg`,
          priority: 8,
        })
      } else if (avgDaysOut <= 5) {
        results.push({
          id: 'health-ok',
          type: 'neutral',
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          title: 'Moderate availability',
          description: `Average wait time is ${avgDaysOut.toFixed(1)} days. Consider reviewing high-wait links.`,
          metric: `${avgDaysOut.toFixed(1)}d avg`,
          priority: 6,
        })
      } else {
        results.push({
          id: 'health-poor',
          type: 'warning',
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
          title: 'High average wait times',
          description: `Average wait is ${avgDaysOut.toFixed(1)} days. This may impact patient access and satisfaction.`,
          metric: `${avgDaysOut.toFixed(1)}d avg`,
          priority: 9,
        })
      }
    }

    // 2. Error rate insight
    if (errorCount > 0) {
      results.push({
        id: 'errors',
        type: 'warning',
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
        title: `${errorCount} link${errorCount > 1 ? 's' : ''} with errors`,
        description: `${errorRate.toFixed(1)}% of links have scraping errors. Review and fix broken scheduling pages.`,
        metric: `${errorRate.toFixed(1)}% error rate`,
        priority: 10,
      })
    } else {
      results.push({
        id: 'no-errors',
        type: 'positive',
        icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
        title: 'All links working',
        description: 'No scraping errors detected. All scheduling pages are accessible.',
        priority: 5,
      })
    }

    // 3. Excellent availability insight
    if (excellentRate >= 50) {
      results.push({
        id: 'excellent-high',
        type: 'positive',
        icon: <Award className="h-5 w-5 text-emerald-600" />,
        title: `${excellentRate.toFixed(0)}% with excellent availability`,
        description: `${excellentCount} links have wait times of 2 days or less. Great patient access!`,
        metric: `${excellentCount} links`,
        priority: 7,
      })
    } else if (excellentRate < 20 && withDaysOut.length > 5) {
      results.push({
        id: 'excellent-low',
        type: 'action',
        icon: <Target className="h-5 w-5 text-amber-600" />,
        title: 'Low excellent availability',
        description: `Only ${excellentRate.toFixed(0)}% of links have ≤2 day wait. Consider capacity adjustments.`,
        metric: `${excellentCount} links`,
        priority: 7,
      })
    }

    // 4. Critical wait times
    if (criticalRate > 20) {
      results.push({
        id: 'critical-high',
        type: 'warning',
        icon: <Clock className="h-5 w-5 text-red-600" />,
        title: `${criticalCount} links with critical wait times`,
        description: `${criticalRate.toFixed(0)}% of links have wait times over 7 days. Prioritize these for review.`,
        metric: `>${7}d wait`,
        priority: 9,
      })
    }

    // 5. Best location insight
    if (bestLocation && bestLocation[1].avgDays <= 3) {
      results.push({
        id: 'best-location',
        type: 'positive',
        icon: <MapPin className="h-5 w-5 text-emerald-600" />,
        title: `${bestLocation[0]} leads in availability`,
        description: `This location averages ${bestLocation[1].avgDays.toFixed(1)} days wait across ${bestLocation[1].count} links.`,
        metric: `${bestLocation[1].avgDays.toFixed(1)}d avg`,
        priority: 6,
      })
    }

    // 6. Worst location insight
    if (worstLocation && worstLocation[1].avgDays > 5 && worstLocation[0] !== bestLocation?.[0]) {
      results.push({
        id: 'worst-location',
        type: 'action',
        icon: <MapPin className="h-5 w-5 text-amber-600" />,
        title: `${worstLocation[0]} needs attention`,
        description: `This location averages ${worstLocation[1].avgDays.toFixed(1)} days wait. Consider capacity review.`,
        metric: `${worstLocation[1].avgDays.toFixed(1)}d avg`,
        priority: 7,
      })
    }

    // 7. Category insights
    if (bestCategory && worstCategory && bestCategory[0] !== worstCategory[0]) {
      const gap = worstCategory[1].avgDays - bestCategory[1].avgDays
      if (gap > 3) {
        results.push({
          id: 'category-gap',
          type: 'neutral',
          icon: <Tag className="h-5 w-5 text-sky-600" />,
          title: `${gap.toFixed(1)}d gap between categories`,
          description: `${bestCategory[0]} (${bestCategory[1].avgDays.toFixed(1)}d) vs ${worstCategory[0]} (${worstCategory[1].avgDays.toFixed(1)}d).`,
          metric: `${gap.toFixed(1)}d difference`,
          priority: 5,
        })
      }
    }

    // 8. Quick wins - links close to excellent
    const almostExcellent = withDaysOut.filter(r => r.daysOut! > 2 && r.daysOut! <= 4)
    if (almostExcellent.length > 0 && almostExcellent.length <= 10) {
      results.push({
        id: 'quick-wins',
        type: 'action',
        icon: <Zap className="h-5 w-5 text-violet-600" />,
        title: `${almostExcellent.length} quick win${almostExcellent.length > 1 ? 's' : ''} available`,
        description: `These links are 2-4 days out. Small improvements could make them excellent.`,
        metric: `${almostExcellent.length} links`,
        priority: 6,
      })
    }

    // 9. Distribution insight
    const under4 = withDaysOut.filter(r => r.daysOut! < 4).length
    const under7 = withDaysOut.filter(r => r.daysOut! < 7).length
    const over7 = withDaysOut.filter(r => r.daysOut! >= 7).length
    
    if (withDaysOut.length >= 10) {
      const distribution = `${Math.round((under4/withDaysOut.length)*100)}% under 4d, ${Math.round((over7/withDaysOut.length)*100)}% over 7d`
      results.push({
        id: 'distribution',
        type: 'neutral',
        icon: <TrendingDown className="h-5 w-5 text-sky-600" />,
        title: 'Wait time distribution',
        description: distribution,
        priority: 4,
      })
    }

    // Sort by priority (highest first)
    return results.sort((a, b) => b.priority - a.priority).slice(0, 6)
  }, [data, categoryType])

  if (insights.length === 0) {
    return null
  }

  const getTypeStyles = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
      case 'warning':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
      case 'action':
        return 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20'
      default:
        return 'border-l-sky-500 bg-sky-50 dark:bg-sky-950/20'
    }
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 font-serif">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Automated Insights
        </CardTitle>
        <CardDescription>
          AI-generated observations based on current data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={cn(
                "p-3 rounded-lg border-l-4 transition-colors",
                getTypeStyles(insight.type)
              )}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    {insight.metric && (
                      <Badge variant="secondary" className="text-xs">
                        {insight.metric}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

