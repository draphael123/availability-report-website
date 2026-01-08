'use client'

import { useMemo } from 'react'
import { Database, Clock, CheckCircle2, AlertTriangle, RefreshCw, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DataQualityProps {
  data: ParsedSheetRow[]
  lastRefreshed: string | null
  source?: 'API' | 'CSV'
}

export function DataQuality({ data, lastRefreshed, source = 'API' }: DataQualityProps) {
  const qualityMetrics = useMemo(() => {
    const total = data.length
    
    // Completeness - how many fields are filled
    let filledFields = 0
    let totalFields = 0
    const requiredFields = ['Name', 'Location', 'URL', 'Days Out']
    
    data.forEach(row => {
      requiredFields.forEach(field => {
        totalFields++
        if (row.raw[field] && row.raw[field].trim() !== '') {
          filledFields++
        }
      })
    })
    
    const completeness = totalFields > 0 ? (filledFields / totalFields) * 100 : 0

    // Data with valid Days Out
    const withDaysOut = data.filter(r => r.daysOut !== null).length
    const daysOutCoverage = total > 0 ? (withDaysOut / total) * 100 : 0

    // Data with valid URLs
    const withUrls = data.filter(r => {
      const url = r.raw['URL'] || r.raw['url']
      return url && url.startsWith('http')
    }).length
    const urlCoverage = total > 0 ? (withUrls / total) * 100 : 0

    // Error-free rate
    const errorFree = data.filter(r => !r.hasError).length
    const errorFreeRate = total > 0 ? (errorFree / total) * 100 : 0

    // Data freshness (based on Scraped At field)
    const scrapedAtValues = data
      .map(r => r.raw['Scraped At'] || r.raw['scraped_at'])
      .filter(Boolean)
    
    let avgFreshnessHours = 0
    let freshnessScore = 100
    
    if (scrapedAtValues.length > 0) {
      // Try to parse dates and calculate average age
      const now = new Date()
      let totalAgeHours = 0
      let validDates = 0
      
      scrapedAtValues.forEach(dateStr => {
        try {
          const date = new Date(dateStr)
          if (!isNaN(date.getTime())) {
            const ageHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
            totalAgeHours += ageHours
            validDates++
          }
        } catch {}
      })
      
      if (validDates > 0) {
        avgFreshnessHours = totalAgeHours / validDates
        // Score: 100 if < 1 hour, decreasing to 0 at 24+ hours
        freshnessScore = Math.max(0, 100 - (avgFreshnessHours * 4))
      }
    }

    // Overall quality score (weighted average)
    const overallScore = (
      completeness * 0.25 +
      daysOutCoverage * 0.25 +
      urlCoverage * 0.15 +
      errorFreeRate * 0.20 +
      freshnessScore * 0.15
    )

    // Quality grade
    let grade: string
    let gradeColor: string
    if (overallScore >= 95) { grade = 'A+'; gradeColor = 'text-emerald-400' }
    else if (overallScore >= 90) { grade = 'A'; gradeColor = 'text-emerald-400' }
    else if (overallScore >= 85) { grade = 'B+'; gradeColor = 'text-blue-400' }
    else if (overallScore >= 80) { grade = 'B'; gradeColor = 'text-blue-400' }
    else if (overallScore >= 75) { grade = 'C+'; gradeColor = 'text-amber-400' }
    else if (overallScore >= 70) { grade = 'C'; gradeColor = 'text-amber-400' }
    else if (overallScore >= 60) { grade = 'D'; gradeColor = 'text-orange-400' }
    else { grade = 'F'; gradeColor = 'text-red-400' }

    return {
      total,
      completeness,
      daysOutCoverage,
      withDaysOut,
      urlCoverage,
      withUrls,
      errorFreeRate,
      errorFree,
      freshnessScore,
      avgFreshnessHours,
      overallScore,
      grade,
      gradeColor,
    }
  }, [data])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400'
    if (score >= 70) return 'text-blue-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500'
    if (score >= 70) return 'bg-blue-500'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-500" />
              <span className="text-gradient-secondary">Data Quality Metrics</span>
            </CardTitle>
            <CardDescription>Data completeness, freshness, and reliability</CardDescription>
          </div>
          <div className="text-center">
            <div className={cn("text-4xl font-bold", qualityMetrics.gradeColor)}>
              {qualityMetrics.grade}
            </div>
            <div className="text-xs text-muted-foreground">Quality Grade</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Overall Quality Score</span>
            <span className={cn("text-2xl font-bold", getScoreColor(qualityMetrics.overallScore))}>
              {qualityMetrics.overallScore.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all", getProgressColor(qualityMetrics.overallScore))}
              style={{ width: `${qualityMetrics.overallScore}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Completeness */}
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Completeness</span>
            </div>
            <div className={cn("text-2xl font-bold", getScoreColor(qualityMetrics.completeness))}>
              {qualityMetrics.completeness.toFixed(0)}%
            </div>
            <Progress value={qualityMetrics.completeness} className="h-1 mt-2" />
            <div className="text-xs text-muted-foreground mt-1">Required fields filled</div>
          </div>

          {/* Days Out Coverage */}
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Wait Time Data</span>
            </div>
            <div className={cn("text-2xl font-bold", getScoreColor(qualityMetrics.daysOutCoverage))}>
              {qualityMetrics.daysOutCoverage.toFixed(0)}%
            </div>
            <Progress value={qualityMetrics.daysOutCoverage} className="h-1 mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {qualityMetrics.withDaysOut} of {qualityMetrics.total} links
            </div>
          </div>

          {/* URL Coverage */}
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Valid URLs</span>
            </div>
            <div className={cn("text-2xl font-bold", getScoreColor(qualityMetrics.urlCoverage))}>
              {qualityMetrics.urlCoverage.toFixed(0)}%
            </div>
            <Progress value={qualityMetrics.urlCoverage} className="h-1 mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {qualityMetrics.withUrls} of {qualityMetrics.total} links
            </div>
          </div>

          {/* Error-Free Rate */}
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Error-Free</span>
            </div>
            <div className={cn("text-2xl font-bold", getScoreColor(qualityMetrics.errorFreeRate))}>
              {qualityMetrics.errorFreeRate.toFixed(0)}%
            </div>
            <Progress value={qualityMetrics.errorFreeRate} className="h-1 mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {qualityMetrics.errorFree} of {qualityMetrics.total} links
            </div>
          </div>

          {/* Freshness */}
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-medium">Data Freshness</span>
            </div>
            <div className={cn("text-2xl font-bold", getScoreColor(qualityMetrics.freshnessScore))}>
              {qualityMetrics.freshnessScore.toFixed(0)}%
            </div>
            <Progress value={qualityMetrics.freshnessScore} className="h-1 mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              ~{qualityMetrics.avgFreshnessHours.toFixed(1)}h avg age
            </div>
          </div>

          {/* Data Source */}
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-medium">Data Source</span>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {source}
            </Badge>
            <div className="text-xs text-muted-foreground mt-2">
              {lastRefreshed ? `Last: ${lastRefreshed}` : 'Live data'}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {qualityMetrics.overallScore < 90 && (
          <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <h4 className="font-semibold text-amber-400 mb-2">Improvement Recommendations</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {qualityMetrics.completeness < 95 && (
                <li>• Fill in missing required fields (Name, Location, URL, Days Out)</li>
              )}
              {qualityMetrics.daysOutCoverage < 95 && (
                <li>• Ensure all links have wait time data populated</li>
              )}
              {qualityMetrics.errorFreeRate < 95 && (
                <li>• Investigate and resolve {qualityMetrics.total - qualityMetrics.errorFree} link errors</li>
              )}
              {qualityMetrics.freshnessScore < 80 && (
                <li>• Data appears stale - consider increasing scrape frequency</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}




