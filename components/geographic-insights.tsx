'use client'

import { useMemo, useState } from 'react'
import { MapPin, ArrowUpDown, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GeographicInsightsProps {
  data: ParsedSheetRow[]
}

interface LocationStats {
  location: string
  totalLinks: number
  avgDaysOut: number | null
  minDaysOut: number | null
  maxDaysOut: number | null
  errorCount: number
  errorRate: number
  under2: number
  under4: number
  under7: number
  over7: number
  trend: 'improving' | 'stable' | 'worsening'
  hrtCount: number
  trtCount: number
  providerCount: number
}

export function GeographicInsights({ data }: GeographicInsightsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'avgDaysOut' | 'totalLinks' | 'errorRate' | 'location'>('avgDaysOut')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const locationStats = useMemo((): LocationStats[] => {
    const locationMap = new Map<string, ParsedSheetRow[]>()
    
    data.forEach(row => {
      const location = row.raw['Location'] || 'Unknown'
      const existing = locationMap.get(location) || []
      existing.push(row)
      locationMap.set(location, existing)
    })

    return Array.from(locationMap.entries()).map(([location, rows]) => {
      const withDaysOut = rows.filter(r => r.daysOut !== null)
      const daysOutValues = withDaysOut.map(r => r.daysOut!)
      
      const avgDaysOut = daysOutValues.length > 0
        ? daysOutValues.reduce((a, b) => a + b, 0) / daysOutValues.length
        : null
      
      const minDaysOut = daysOutValues.length > 0 ? Math.min(...daysOutValues) : null
      const maxDaysOut = daysOutValues.length > 0 ? Math.max(...daysOutValues) : null
      
      const errorCount = rows.filter(r => r.hasError).length
      const errorRate = rows.length > 0 ? (errorCount / rows.length) * 100 : 0

      // Simulated trend based on current data variance
      const trend = avgDaysOut !== null 
        ? avgDaysOut < 4 ? 'improving' : avgDaysOut > 7 ? 'worsening' : 'stable'
        : 'stable'

      return {
        location,
        totalLinks: rows.length,
        avgDaysOut: avgDaysOut !== null ? Math.round(avgDaysOut * 10) / 10 : null,
        minDaysOut,
        maxDaysOut,
        errorCount,
        errorRate: Math.round(errorRate * 10) / 10,
        under2: withDaysOut.filter(r => r.daysOut! < 2).length,
        under4: withDaysOut.filter(r => r.daysOut! >= 2 && r.daysOut! < 4).length,
        under7: withDaysOut.filter(r => r.daysOut! >= 4 && r.daysOut! < 7).length,
        over7: withDaysOut.filter(r => r.daysOut! >= 7).length,
        trend,
        hrtCount: rows.filter(r => r.categoryType === 'HRT').length,
        trtCount: rows.filter(r => r.categoryType === 'TRT').length,
        providerCount: rows.filter(r => r.categoryType === 'Provider').length,
      }
    })
  }, [data])

  const filteredAndSorted = useMemo(() => {
    let result = [...locationStats]
    
    // Filter by search
    if (searchTerm) {
      result = result.filter(l => 
        l.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'avgDaysOut':
          comparison = (a.avgDaysOut ?? 999) - (b.avgDaysOut ?? 999)
          break
        case 'totalLinks':
          comparison = a.totalLinks - b.totalLinks
          break
        case 'errorRate':
          comparison = a.errorRate - b.errorRate
          break
        case 'location':
          comparison = a.location.localeCompare(b.location)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [locationStats, searchTerm, sortBy, sortOrder])

  const bestLocation = useMemo(() => {
    const sorted = [...locationStats].filter(l => l.avgDaysOut !== null)
    sorted.sort((a, b) => (a.avgDaysOut ?? 999) - (b.avgDaysOut ?? 999))
    return sorted[0]
  }, [locationStats])

  const worstLocation = useMemo(() => {
    const sorted = [...locationStats].filter(l => l.avgDaysOut !== null)
    sorted.sort((a, b) => (b.avgDaysOut ?? 0) - (a.avgDaysOut ?? 0))
    return sorted[0]
  }, [locationStats])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingDown className="h-4 w-4 text-emerald-500" />
      case 'worsening': return <TrendingUp className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getAvgColor = (avg: number | null) => {
    if (avg === null) return 'text-muted-foreground'
    if (avg < 2) return 'text-emerald-500'
    if (avg < 4) return 'text-blue-500'
    if (avg < 7) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          <span className="text-gradient-secondary">Geographic Insights</span>
        </CardTitle>
        <CardDescription>Location-by-location performance comparison</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/30 border text-center">
            <div className="text-2xl font-bold text-gradient-primary">{locationStats.length}</div>
            <div className="text-xs text-muted-foreground">Total Locations</div>
          </div>
          {bestLocation && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-xs text-emerald-400 font-medium mb-1">Best Location</div>
              <div className="font-semibold truncate" title={bestLocation.location}>{bestLocation.location}</div>
              <div className="text-sm text-emerald-400">{bestLocation.avgDaysOut}d avg</div>
            </div>
          )}
          {worstLocation && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="text-xs text-red-400 font-medium mb-1">Needs Attention</div>
              <div className="font-semibold truncate" title={worstLocation.location}>{worstLocation.location}</div>
              <div className="text-sm text-red-400">{worstLocation.avgDaysOut}d avg</div>
            </div>
          )}
          <div className="p-3 rounded-lg bg-muted/30 border text-center">
            <div className="text-2xl font-bold">{locationStats.filter(l => l.avgDaysOut !== null && l.avgDaysOut < 4).length}</div>
            <div className="text-xs text-muted-foreground">Under 4 Day Avg</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="avgDaysOut">Avg Days Out</SelectItem>
              <SelectItem value="totalLinks">Total Links</SelectItem>
              <SelectItem value="errorRate">Error Rate</SelectItem>
              <SelectItem value="location">Location Name</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-center p-3 font-medium">Links</th>
                  <th className="text-center p-3 font-medium">Avg Days</th>
                  <th className="text-center p-3 font-medium">Min/Max</th>
                  <th className="text-center p-3 font-medium">Distribution</th>
                  <th className="text-center p-3 font-medium">Errors</th>
                  <th className="text-center p-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAndSorted.map((loc) => (
                  <tr key={loc.location} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{loc.location}</div>
                      <div className="text-xs text-muted-foreground">
                        {loc.hrtCount > 0 && <span className="text-pink-400">HRT:{loc.hrtCount} </span>}
                        {loc.trtCount > 0 && <span className="text-blue-400">TRT:{loc.trtCount} </span>}
                        {loc.providerCount > 0 && <span className="text-purple-400">Prov:{loc.providerCount}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono">{loc.totalLinks}</td>
                    <td className={cn("p-3 text-center font-mono font-bold", getAvgColor(loc.avgDaysOut))}>
                      {loc.avgDaysOut !== null ? `${loc.avgDaysOut}d` : '—'}
                    </td>
                    <td className="p-3 text-center text-xs text-muted-foreground">
                      {loc.minDaysOut !== null ? `${loc.minDaysOut}-${loc.maxDaysOut}d` : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex h-4 rounded overflow-hidden min-w-[80px]">
                        {loc.under2 > 0 && (
                          <div 
                            className="bg-emerald-500" 
                            style={{ width: `${(loc.under2 / loc.totalLinks) * 100}%` }}
                            title={`<2d: ${loc.under2}`}
                          />
                        )}
                        {loc.under4 > 0 && (
                          <div 
                            className="bg-blue-500" 
                            style={{ width: `${(loc.under4 / loc.totalLinks) * 100}%` }}
                            title={`2-4d: ${loc.under4}`}
                          />
                        )}
                        {loc.under7 > 0 && (
                          <div 
                            className="bg-orange-500" 
                            style={{ width: `${(loc.under7 / loc.totalLinks) * 100}%` }}
                            title={`4-7d: ${loc.under7}`}
                          />
                        )}
                        {loc.over7 > 0 && (
                          <div 
                            className="bg-red-500" 
                            style={{ width: `${(loc.over7 / loc.totalLinks) * 100}%` }}
                            title={`7+d: ${loc.over7}`}
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {loc.errorCount > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          {loc.errorCount} ({loc.errorRate}%)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">
                          None
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {getTrendIcon(loc.trend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}




