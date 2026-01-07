'use client'

import { useEffect, useMemo, useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Search,
  Filter,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ParsedSheetRow } from '@/lib/types'

interface LinkPerformanceTrackerProps {
  currentData: ParsedSheetRow[]
}

interface LinkPerformance {
  name: string
  url: string
  location: string
  category: string
  categoryType: string
  currentDaysOut: number | null
  previousDaysOut: number | null
  change: number | null
  changePercent: number | null
  trend: 'improved' | 'worsened' | 'stable' | 'new' | 'unknown'
  hasError: boolean
  errorDetails?: string
}

interface HistoricalSnapshot {
  date: string
  data: {
    raw: Record<string, string>
    daysOut: number | null
    hasError: boolean
  }[]
}

export function LinkPerformanceTracker({ currentData }: LinkPerformanceTrackerProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [trendFilter, setTrendFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('change')

  // Fetch last week's data
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Get date from 7 days ago
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const dateStr = weekAgo.toISOString().split('T')[0]
        
        const res = await fetch(`/api/history?date=${dateStr}`)
        if (res.ok) {
          const data = await res.json()
          if (data && !data.error) {
            setHistoricalData(data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch historical data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  // Calculate performance for each link
  const linkPerformance = useMemo((): LinkPerformance[] => {
    // Create a map of historical data by link name
    const historicalMap = new Map<string, { daysOut: number | null; hasError: boolean }>()
    
    if (historicalData?.data) {
      historicalData.data.forEach(row => {
        const name = row.raw['Name'] || row.raw['name'] || ''
        if (name) {
          historicalMap.set(name.toLowerCase(), {
            daysOut: row.daysOut,
            hasError: row.hasError,
          })
        }
      })
    }

    return currentData.map(row => {
      const name = row.raw['Name'] || row.raw['name'] || 'Unknown'
      const url = row.raw['URL'] || row.raw['url'] || ''
      const location = row.raw['Location'] || row.raw['location'] || 'Unknown'
      const category = row.raw['Category'] || row.raw['category'] || 'Unknown'
      
      const historical = historicalMap.get(name.toLowerCase())
      const currentDaysOut = row.daysOut
      const previousDaysOut = historical?.daysOut ?? null
      
      let change: number | null = null
      let changePercent: number | null = null
      let trend: LinkPerformance['trend'] = 'unknown'
      
      if (currentDaysOut !== null && previousDaysOut !== null) {
        change = currentDaysOut - previousDaysOut
        changePercent = previousDaysOut > 0 
          ? Math.round((change / previousDaysOut) * 100) 
          : null
        
        if (change < -2) {
          trend = 'improved' // Days out decreased (good)
        } else if (change > 2) {
          trend = 'worsened' // Days out increased (bad)
        } else {
          trend = 'stable'
        }
      } else if (currentDaysOut !== null && previousDaysOut === null) {
        trend = 'new'
      }
      
      return {
        name,
        url,
        location,
        category,
        categoryType: row.categoryType,
        currentDaysOut,
        previousDaysOut,
        change,
        changePercent,
        trend,
        hasError: row.hasError,
        errorDetails: row.raw['Error Details'] || row.raw['Error Code'] || undefined,
      }
    })
  }, [currentData, historicalData])

  // Filter and sort
  const filteredData = useMemo(() => {
    let result = [...linkPerformance]
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(link => 
        link.name.toLowerCase().includes(search) ||
        link.location.toLowerCase().includes(search) ||
        link.category.toLowerCase().includes(search)
      )
    }
    
    // Trend filter
    if (trendFilter !== 'all') {
      result = result.filter(link => link.trend === trendFilter)
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'change':
          // Sort by absolute change, nulls last
          if (a.change === null && b.change === null) return 0
          if (a.change === null) return 1
          if (b.change === null) return -1
          return Math.abs(b.change) - Math.abs(a.change)
        case 'change-asc':
          // Best improvements first (most negative change)
          if (a.change === null && b.change === null) return 0
          if (a.change === null) return 1
          if (b.change === null) return -1
          return a.change - b.change
        case 'change-desc':
          // Worst changes first (most positive change)
          if (a.change === null && b.change === null) return 0
          if (a.change === null) return 1
          if (b.change === null) return -1
          return b.change - a.change
        case 'current':
          if (a.currentDaysOut === null && b.currentDaysOut === null) return 0
          if (a.currentDaysOut === null) return 1
          if (b.currentDaysOut === null) return -1
          return a.currentDaysOut - b.currentDaysOut
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
    
    return result
  }, [linkPerformance, searchTerm, trendFilter, sortBy])

  // Summary stats
  const stats = useMemo(() => {
    const withChange = linkPerformance.filter(l => l.change !== null)
    const improved = withChange.filter(l => l.trend === 'improved').length
    const worsened = withChange.filter(l => l.trend === 'worsened').length
    const stable = withChange.filter(l => l.trend === 'stable').length
    const avgChange = withChange.length > 0
      ? withChange.reduce((sum, l) => sum + l.change!, 0) / withChange.length
      : null
    
    return { improved, worsened, stable, avgChange, total: linkPerformance.length }
  }, [linkPerformance])

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Name', 'Location', 'Category', 'Type', 'Current Days Out', 'Previous Days Out', 'Change', 'Change %', 'Trend', 'Has Error']
    const rows = filteredData.map(link => [
      link.name,
      link.location,
      link.category,
      link.categoryType,
      link.currentDaysOut ?? 'N/A',
      link.previousDaysOut ?? 'N/A',
      link.change ?? 'N/A',
      link.changePercent ? `${link.changePercent}%` : 'N/A',
      link.trend,
      link.hasError ? 'Yes' : 'No',
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `link-performance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-gradient-primary">Week-over-Week Performance</span>
            </CardTitle>
            <CardDescription>
              Compare each link's current wait time vs. 7 days ago
              {!historicalData && !loading && (
                <span className="text-amber-500 ml-2">(No historical data available yet)</span>
              )}
            </CardDescription>
          </div>
          
          {/* Summary badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300">
              <TrendingDown className="h-3 w-3 mr-1" />
              {stats.improved} improved
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-300">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats.worsened} worsened
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-300">
              <Minus className="h-3 w-3 mr-1" />
              {stats.stable} stable
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, location, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={trendFilter} onValueChange={setTrendFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter trend" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trends</SelectItem>
              <SelectItem value="improved">Improved</SelectItem>
              <SelectItem value="worsened">Worsened</SelectItem>
              <SelectItem value="stable">Stable</SelectItem>
              <SelectItem value="new">New Links</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="change">Biggest Changes</SelectItem>
              <SelectItem value="change-asc">Best Improvements</SelectItem>
              <SelectItem value="change-desc">Worst Changes</SelectItem>
              <SelectItem value="current">Current Days Out</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={exportCSV} title="Export to CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {linkPerformance.length} links
          {stats.avgChange !== null && (
            <span className="ml-2">
              • Avg change: 
              <span className={cn(
                "font-semibold ml-1",
                stats.avgChange < 0 ? "text-emerald-500" : stats.avgChange > 0 ? "text-red-500" : ""
              )}>
                {stats.avgChange > 0 ? '+' : ''}{stats.avgChange.toFixed(1)} days
              </span>
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <span className="ml-2 text-muted-foreground">Loading historical data...</span>
          </div>
        ) : (
          /* Performance table */
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr className="text-xs text-muted-foreground">
                    <th className="text-left p-3 font-medium">Link Name</th>
                    <th className="text-left p-3 font-medium">Location</th>
                    <th className="text-center p-3 font-medium">Type</th>
                    <th className="text-right p-3 font-medium">Current</th>
                    <th className="text-right p-3 font-medium">Last Week</th>
                    <th className="text-right p-3 font-medium">Change</th>
                    <th className="text-center p-3 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredData.map((link, idx) => (
                    <tr 
                      key={idx} 
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        link.hasError && "bg-red-500/5"
                      )}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {link.hasError && (
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-[200px]" title={link.name}>
                              {link.name}
                            </div>
                            {link.url && (
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                              >
                                Open link <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {link.location}
                      </td>
                      <td className="p-3 text-center">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            link.categoryType === 'HRT' && "bg-pink-500/10 text-pink-600 border-pink-300",
                            link.categoryType === 'TRT' && "bg-blue-500/10 text-blue-600 border-blue-300",
                            link.categoryType === 'Provider' && "bg-purple-500/10 text-purple-600 border-purple-300"
                          )}
                        >
                          {link.categoryType === 'all' ? 'Other' : link.categoryType}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono">
                        {link.currentDaysOut !== null ? (
                          <span className={cn(
                            link.currentDaysOut <= 7 && "text-emerald-500",
                            link.currentDaysOut > 7 && link.currentDaysOut <= 14 && "text-blue-500",
                            link.currentDaysOut > 14 && link.currentDaysOut <= 30 && "text-amber-500",
                            link.currentDaysOut > 30 && "text-red-500"
                          )}>
                            {link.currentDaysOut}d
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {link.previousDaysOut !== null ? `${link.previousDaysOut}d` : '—'}
                      </td>
                      <td className="p-3 text-right">
                        {link.change !== null ? (
                          <span className={cn(
                            "font-mono font-semibold",
                            link.change < 0 && "text-emerald-500",
                            link.change > 0 && "text-red-500",
                            link.change === 0 && "text-muted-foreground"
                          )}>
                            {link.change > 0 ? '+' : ''}{link.change}d
                            {link.changePercent !== null && (
                              <span className="text-xs ml-1 opacity-70">
                                ({link.changePercent > 0 ? '+' : ''}{link.changePercent}%)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <TrendBadge trend={link.trend} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* No historical data message */}
        {!loading && !historicalData && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
            <p className="font-medium text-amber-600 dark:text-amber-400">
              📊 Historical comparison requires snapshots
            </p>
            <p className="text-muted-foreground mt-1">
              Go to "Historical Comparison" section and click "Generate 30 Days History" to enable week-over-week tracking.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TrendBadge({ trend }: { trend: LinkPerformance['trend'] }) {
  switch (trend) {
    case 'improved':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
          <ArrowDownRight className="h-3 w-3" />
          Improved
        </span>
      )
    case 'worsened':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-500/10 px-2 py-1 rounded-full">
          <ArrowUpRight className="h-3 w-3" />
          Worsened
        </span>
      )
    case 'stable':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-500/10 px-2 py-1 rounded-full">
          <Minus className="h-3 w-3" />
          Stable
        </span>
      )
    case 'new':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-500/10 px-2 py-1 rounded-full">
          New
        </span>
      )
    default:
      return (
        <span className="text-xs text-muted-foreground">—</span>
      )
  }
}

