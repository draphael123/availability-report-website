'use client'

import { useMemo } from 'react'
import { 
  Trophy, 
  AlertTriangle, 
  ExternalLink, 
  Calendar,
  TrendingDown,
  TrendingUp,
  Clock,
  Award,
  Target
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ParsedSheetRow, CategoryType } from '@/lib/types'

interface DailyReportProps {
  data: ParsedSheetRow[]
  categoryType: CategoryType
}

interface RankedLink {
  rank: number
  name: string
  url: string
  location: string
  category: string
  categoryType: string
  daysOut: number
  hasError: boolean
}

export function DailyReport({ data, categoryType }: DailyReportProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Get top 10 best (lowest days out) and worst (highest days out)
  const { bestPerformers, worstPerformers, stats } = useMemo(() => {
    // Filter to only links with valid days out and no errors
    const validLinks = data.filter(row => row.daysOut !== null && !row.hasError)
    
    // Sort by days out
    const sorted = [...validLinks].sort((a, b) => a.daysOut! - b.daysOut!)
    
    // Get best 10 (lowest days out)
    const best: RankedLink[] = sorted.slice(0, 10).map((row, idx) => ({
      rank: idx + 1,
      name: row.raw['Name'] || row.raw['name'] || 'Unknown',
      url: row.raw['URL'] || row.raw['url'] || '',
      location: row.raw['Location'] || row.raw['location'] || 'Unknown',
      category: row.raw['Category'] || row.raw['category'] || 'Unknown',
      categoryType: row.categoryType,
      daysOut: row.daysOut!,
      hasError: row.hasError,
    }))
    
    // Get worst 10 (highest days out)
    const worst: RankedLink[] = sorted.slice(-10).reverse().map((row, idx) => ({
      rank: idx + 1,
      name: row.raw['Name'] || row.raw['name'] || 'Unknown',
      url: row.raw['URL'] || row.raw['url'] || '',
      location: row.raw['Location'] || row.raw['location'] || 'Unknown',
      category: row.raw['Category'] || row.raw['category'] || 'Unknown',
      categoryType: row.categoryType,
      daysOut: row.daysOut!,
      hasError: row.hasError,
    }))
    
    // Calculate stats
    const totalLinks = data.length
    const linksWithData = validLinks.length
    const errorCount = data.filter(r => r.hasError).length
    const avgDaysOut = validLinks.length > 0
      ? validLinks.reduce((sum, r) => sum + r.daysOut!, 0) / validLinks.length
      : null
    const medianDaysOut = validLinks.length > 0
      ? sorted[Math.floor(sorted.length / 2)].daysOut
      : null
    const under7Days = validLinks.filter(r => r.daysOut! <= 7).length
    const over30Days = validLinks.filter(r => r.daysOut! > 30).length
    
    return {
      bestPerformers: best,
      worstPerformers: worst,
      stats: {
        totalLinks,
        linksWithData,
        errorCount,
        avgDaysOut,
        medianDaysOut,
        under7Days,
        over30Days,
        pctUnder7: linksWithData > 0 ? Math.round((under7Days / linksWithData) * 100) : 0,
        pctOver30: linksWithData > 0 ? Math.round((over30Days / linksWithData) * 100) : 0,
      }
    }
  }, [data])

  const categoryLabel = categoryType === 'all' ? 'All Links' : `${categoryType} Links`

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card className="glass border-2 border-purple-200/50 dark:border-purple-800/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-gradient-primary">Daily Availability Report</CardTitle>
                <CardDescription className="text-sm">{today} • {categoryLabel}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-300">
              {stats.linksWithData} links analyzed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatBox
              icon={<Target className="h-4 w-4" />}
              label="Average Wait"
              value={stats.avgDaysOut ? `${stats.avgDaysOut.toFixed(1)}d` : 'N/A'}
              color="purple"
            />
            <StatBox
              icon={<Clock className="h-4 w-4" />}
              label="Median Wait"
              value={stats.medianDaysOut ? `${stats.medianDaysOut}d` : 'N/A'}
              color="blue"
            />
            <StatBox
              icon={<TrendingDown className="h-4 w-4" />}
              label="Under 7 Days"
              value={`${stats.under7Days} (${stats.pctUnder7}%)`}
              color="emerald"
            />
            <StatBox
              icon={<TrendingUp className="h-4 w-4" />}
              label="Over 30 Days"
              value={`${stats.over30Days} (${stats.pctOver30}%)`}
              color="red"
            />
            <StatBox
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Errors"
              value={stats.errorCount.toString()}
              color={stats.errorCount > 0 ? "amber" : "emerald"}
            />
            <StatBox
              icon={<Award className="h-4 w-4" />}
              label="Best Wait"
              value={bestPerformers[0] ? `${bestPerformers[0].daysOut}d` : 'N/A'}
              color="emerald"
            />
          </div>
        </CardContent>
      </Card>

      {/* Best and Worst Performers */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top 10 Best */}
        <Card className="glass border-emerald-200/50 dark:border-emerald-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/30">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Top 10 - Shortest Wait Times
              </span>
            </CardTitle>
            <CardDescription>Links with the best availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bestPerformers.map((link) => (
                <LinkRow key={link.name} link={link} type="best" />
              ))}
              {bestPerformers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 10 Worst */}
        <Card className="glass border-red-200/50 dark:border-red-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-400 to-rose-500 shadow-lg shadow-red-500/30">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Top 10 - Longest Wait Times
              </span>
            </CardTitle>
            <CardDescription>Links needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {worstPerformers.map((link) => (
                <LinkRow key={link.name} link={link} type="worst" />
              ))}
              {worstPerformers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links with Errors */}
      {stats.errorCount > 0 && (
        <Card className="glass border-amber-200/50 dark:border-amber-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Links with Errors ({stats.errorCount})
              </span>
            </CardTitle>
            <CardDescription>These links need immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.filter(r => r.hasError).slice(0, 12).map((row, idx) => {
                const name = row.raw['Name'] || row.raw['name'] || 'Unknown'
                const url = row.raw['URL'] || row.raw['url'] || ''
                const errorDetails = row.raw['Error Details'] || row.raw['Error Code'] || 'Unknown error'
                
                return (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg bg-red-500/5 border border-red-200/50 dark:border-red-800/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" title={name}>{name}</p>
                        <p className="text-xs text-red-600 dark:text-red-400 truncate" title={errorDetails}>
                          {errorDetails}
                        </p>
                      </div>
                      {url && (
                        <a 
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {stats.errorCount > 12 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                +{stats.errorCount - 12} more errors (use Errors filter to see all)
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatBox({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  color: 'purple' | 'blue' | 'emerald' | 'red' | 'amber'
}) {
  const colorClasses = {
    purple: 'from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    blue: 'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    emerald: 'from-emerald-500/10 to-green-500/10 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    red: 'from-red-500/10 to-rose-500/10 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    amber: 'from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
  }

  return (
    <div className={cn(
      "p-3 rounded-xl border bg-gradient-to-br",
      colorClasses[color]
    )}>
      <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}

function LinkRow({ link, type }: { link: RankedLink; type: 'best' | 'worst' }) {
  const rankColors = type === 'best' 
    ? ['bg-gradient-to-r from-amber-400 to-yellow-500', 'bg-gradient-to-r from-gray-300 to-gray-400', 'bg-gradient-to-r from-amber-600 to-orange-600']
    : ['bg-gradient-to-r from-red-500 to-rose-500', 'bg-gradient-to-r from-red-400 to-rose-400', 'bg-gradient-to-r from-red-300 to-rose-300']

  return (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg transition-colors",
      "hover:bg-muted/50"
    )}>
      {/* Rank badge */}
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
        link.rank <= 3 ? rankColors[link.rank - 1] : "bg-muted text-muted-foreground"
      )}>
        {link.rank}
      </div>
      
      {/* Link info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate" title={link.name}>
            {link.name}
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] shrink-0",
              link.categoryType === 'HRT' && "bg-pink-500/10 text-pink-600 border-pink-300",
              link.categoryType === 'TRT' && "bg-blue-500/10 text-blue-600 border-blue-300",
              link.categoryType === 'Provider' && "bg-purple-500/10 text-purple-600 border-purple-300"
            )}
          >
            {link.categoryType === 'all' ? 'Other' : link.categoryType}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{link.location}</span>
      </div>
      
      {/* Days out */}
      <div className={cn(
        "text-right shrink-0",
        type === 'best' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}>
        <span className="text-lg font-bold">{link.daysOut}</span>
        <span className="text-xs ml-0.5">days</span>
      </div>
      
      {/* External link */}
      {link.url && (
        <a 
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 shrink-0"
          title="Open booking link"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}



