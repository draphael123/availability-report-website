'use client'

import { useMemo } from 'react'
import { Scale, TrendingUp, TrendingDown, Minus, Award, Target } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ComparativeBenchmarksProps {
  data: ParsedSheetRow[]
}

interface CategoryBenchmark {
  category: string
  color: string
  metrics: {
    avgDaysOut: number
    under2Rate: number
    under4Rate: number
    under7Rate: number
    errorRate: number
    totalLinks: number
  }
  score: number
  grade: string
  trend: 'up' | 'down' | 'stable'
}

export function ComparativeBenchmarks({ data }: ComparativeBenchmarksProps) {
  const benchmarks = useMemo((): CategoryBenchmark[] => {
    const categories = [
      { name: 'HRT', color: '#ec4899' },
      { name: 'TRT', color: '#3b82f6' },
      { name: 'Provider', color: '#8b5cf6' },
    ]

    return categories.map(cat => {
      const categoryData = data.filter(r => r.categoryType === cat.name)
      const withDaysOut = categoryData.filter(r => r.daysOut !== null)
      
      const avgDaysOut = withDaysOut.length > 0
        ? withDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / withDaysOut.length
        : 0

      const under2Rate = withDaysOut.length > 0
        ? (withDaysOut.filter(r => r.daysOut! < 2).length / withDaysOut.length) * 100
        : 0

      const under4Rate = withDaysOut.length > 0
        ? (withDaysOut.filter(r => r.daysOut! < 4).length / withDaysOut.length) * 100
        : 0

      const under7Rate = withDaysOut.length > 0
        ? (withDaysOut.filter(r => r.daysOut! < 7).length / withDaysOut.length) * 100
        : 0

      const errorRate = categoryData.length > 0
        ? (categoryData.filter(r => r.hasError).length / categoryData.length) * 100
        : 0

      // Calculate overall score (0-100)
      // Lower avg days is better, higher rates are better, lower error rate is better
      const avgDaysScore = Math.max(0, 100 - (avgDaysOut * 5))
      const under4Score = under4Rate
      const errorScore = 100 - errorRate
      
      const score = Math.round((avgDaysScore * 0.4) + (under4Score * 0.4) + (errorScore * 0.2))

      // Grade
      let grade: string
      if (score >= 90) grade = 'A'
      else if (score >= 80) grade = 'B'
      else if (score >= 70) grade = 'C'
      else if (score >= 60) grade = 'D'
      else grade = 'F'

      // Simulated trend
      const trend: 'up' | 'down' | 'stable' = score >= 80 ? 'down' : score < 60 ? 'up' : 'stable'

      return {
        category: cat.name,
        color: cat.color,
        metrics: {
          avgDaysOut: Math.round(avgDaysOut * 10) / 10,
          under2Rate: Math.round(under2Rate),
          under4Rate: Math.round(under4Rate),
          under7Rate: Math.round(under7Rate),
          errorRate: Math.round(errorRate * 10) / 10,
          totalLinks: categoryData.length,
        },
        score,
        grade,
        trend,
      }
    }).filter(b => b.metrics.totalLinks > 0)
  }, [data])

  // Radar chart data
  const radarData = useMemo(() => {
    const metrics = [
      'Avg Wait (inv)',
      'Under 2d %',
      'Under 4d %',
      'Under 7d %',
      'Error-Free %',
    ]

    return metrics.map(metric => {
      const point: Record<string, string | number> = { metric }
      
      benchmarks.forEach(b => {
        switch (metric) {
          case 'Avg Wait (inv)':
            // Invert so higher is better (max 10 days normalized)
            point[b.category] = Math.max(0, 100 - (b.metrics.avgDaysOut * 10))
            break
          case 'Under 2d %':
            point[b.category] = b.metrics.under2Rate
            break
          case 'Under 4d %':
            point[b.category] = b.metrics.under4Rate
            break
          case 'Under 7d %':
            point[b.category] = b.metrics.under7Rate
            break
          case 'Error-Free %':
            point[b.category] = 100 - b.metrics.errorRate
            break
        }
      })
      
      return point
    })
  }, [benchmarks])

  // Find best performer
  const bestPerformer = useMemo(() => {
    return [...benchmarks].sort((a, b) => b.score - a.score)[0]
  }, [benchmarks])

  // Industry benchmarks (simulated targets)
  const industryBenchmarks = {
    avgDaysOut: 5,
    under4Rate: 60,
    errorRate: 5,
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'down': return <TrendingDown className="h-4 w-4 text-emerald-500" />
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
      case 'B': return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'C': return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
      case 'D': return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      default: return 'text-red-400 bg-red-500/20 border-red-500/30'
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Scale className="h-5 w-5 text-indigo-500" />
          <span className="text-gradient-secondary">Comparative Benchmarks</span>
        </CardTitle>
        <CardDescription>Category comparison and industry benchmarks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Best Performer Banner */}
        {bestPerformer && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-amber-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Best Performing Category</div>
                  <div className="text-xl font-bold text-amber-400">{bestPerformer.category}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-amber-400">{bestPerformer.score}</div>
                <div className="text-xs text-muted-foreground">Performance Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Category Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {benchmarks.map(b => (
            <div
              key={b.category}
              className="p-4 rounded-lg border bg-muted/20"
              style={{ borderColor: `${b.color}40` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                  <span className="font-semibold">{b.category}</span>
                </div>
                <Badge className={cn("text-lg px-3", getGradeColor(b.grade))}>
                  {b.grade}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Wait</span>
                  <span className={cn(
                    "font-medium",
                    b.metrics.avgDaysOut < industryBenchmarks.avgDaysOut ? "text-emerald-400" : "text-red-400"
                  )}>
                    {b.metrics.avgDaysOut}d
                    {b.metrics.avgDaysOut < industryBenchmarks.avgDaysOut && " ✓"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Under 4 Days</span>
                  <span className={cn(
                    "font-medium",
                    b.metrics.under4Rate >= industryBenchmarks.under4Rate ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {b.metrics.under4Rate}%
                    {b.metrics.under4Rate >= industryBenchmarks.under4Rate && " ✓"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Error Rate</span>
                  <span className={cn(
                    "font-medium",
                    b.metrics.errorRate <= industryBenchmarks.errorRate ? "text-emerald-400" : "text-red-400"
                  )}>
                    {b.metrics.errorRate}%
                    {b.metrics.errorRate <= industryBenchmarks.errorRate && " ✓"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Links</span>
                  <span className="font-medium">{b.metrics.totalLinks}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(b.trend)}
                  <span className="text-muted-foreground">
                    {b.trend === 'down' ? 'Improving' : b.trend === 'up' ? 'Needs work' : 'Stable'}
                  </span>
                </div>
                <div className="text-sm font-semibold">Score: {b.score}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Radar Chart Comparison */}
        <div className="p-4 rounded-lg border bg-muted/20">
          <h4 className="font-semibold mb-4 text-sm">Multi-Dimensional Comparison</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#444" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#888', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#888', fontSize: 10 }} />
                {benchmarks.map(b => (
                  <Radar
                    key={b.category}
                    name={b.category}
                    dataKey={b.category}
                    stroke={b.color}
                    fill={b.color}
                    fillOpacity={0.2}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Industry Benchmark Targets */}
        <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-purple-500" />
            <span className="font-semibold text-purple-400">Target Benchmarks</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Avg Wait Target</div>
              <div className="font-semibold">≤{industryBenchmarks.avgDaysOut} days</div>
            </div>
            <div>
              <div className="text-muted-foreground">Under 4 Days Target</div>
              <div className="font-semibold">≥{industryBenchmarks.under4Rate}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Error Rate Target</div>
              <div className="font-semibold">≤{industryBenchmarks.errorRate}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}




