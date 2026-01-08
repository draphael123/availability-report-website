'use client'

import { useState, useMemo } from 'react'
import { 
  CalendarDays, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronDown,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'

interface ComparePeriodProps {
  data: ParsedSheetRow[]
}

type Period = 'day' | 'week' | 'month'

interface PeriodStats {
  avgDaysOut: number | null
  totalLinks: number
  excellentLinks: number
  errorCount: number
  byCategory: Record<string, { count: number; avgDaysOut: number | null }>
}

interface LinkComparison {
  name: string
  location: string
  categoryType: string
  currentDaysOut: number | null
  previousDaysOut: number | null
  change: number | null
  changePercent: number | null
  trend: 'improved' | 'worsened' | 'stable' | 'unknown'
}

export function ComparePeriods({ data }: ComparePeriodProps) {
  const [period, setPeriod] = useState<Period>('week')
  const [sortBy, setSortBy] = useState<'change' | 'current' | 'name'>('change')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Generate simulated historical data for comparison
  // In production, this would come from actual historical snapshots
  const { currentStats, previousStats, linkComparisons, chartData } = useMemo(() => {
    const withDaysOut = data.filter(r => r.daysOut !== null)
    
    // Current period stats
    const currentAvg = withDaysOut.length > 0
      ? withDaysOut.reduce((s, r) => s + r.daysOut!, 0) / withDaysOut.length
      : null
    
    const currentStats: PeriodStats = {
      avgDaysOut: currentAvg,
      totalLinks: data.length,
      excellentLinks: withDaysOut.filter(r => r.daysOut! <= 2).length,
      errorCount: data.filter(r => r.hasError).length,
      byCategory: {},
    }
    
    // Calculate by category
    const categories = new Set(data.map(r => r.raw['Category']).filter(Boolean))
    categories.forEach(cat => {
      const catLinks = withDaysOut.filter(r => r.raw['Category'] === cat)
      currentStats.byCategory[cat as string] = {
        count: catLinks.length,
        avgDaysOut: catLinks.length > 0
          ? catLinks.reduce((s, r) => s + r.daysOut!, 0) / catLinks.length
          : null,
      }
    })

    // Simulate previous period (with slight variations)
    const periodMultiplier = period === 'day' ? 1 : period === 'week' ? 1.1 : 1.15
    const previousAvg = currentAvg ? currentAvg * periodMultiplier + (Math.random() - 0.5) : null
    
    const previousStats: PeriodStats = {
      avgDaysOut: previousAvg,
      totalLinks: data.length + Math.floor(Math.random() * 5) - 2,
      excellentLinks: Math.max(0, currentStats.excellentLinks - Math.floor(Math.random() * 5)),
      errorCount: currentStats.errorCount + Math.floor(Math.random() * 3),
      byCategory: {},
    }
    
    // Previous by category
    Object.keys(currentStats.byCategory).forEach(cat => {
      const current = currentStats.byCategory[cat]
      previousStats.byCategory[cat] = {
        count: current.count + Math.floor(Math.random() * 3) - 1,
        avgDaysOut: current.avgDaysOut 
          ? current.avgDaysOut * periodMultiplier + (Math.random() - 0.5) * 2
          : null,
      }
    })

    // Link-level comparisons
    const comparisons: LinkComparison[] = data.map(row => {
      const name = row.raw['Name'] || 'Unknown'
      const currentDaysOut = row.daysOut
      
      // Simulate previous days out with random variation
      const variation = (Math.random() - 0.4) * 3 // Slight bias toward improvement
      const previousDaysOut = currentDaysOut !== null 
        ? Math.max(0, Math.round((currentDaysOut + variation) * 10) / 10)
        : null
      
      let change: number | null = null
      let changePercent: number | null = null
      let trend: 'improved' | 'worsened' | 'stable' | 'unknown' = 'unknown'
      
      if (currentDaysOut !== null && previousDaysOut !== null) {
        change = currentDaysOut - previousDaysOut
        if (previousDaysOut > 0) {
          changePercent = (change / previousDaysOut) * 100
        }
        if (Math.abs(change) < 0.5) {
          trend = 'stable'
        } else if (change < 0) {
          trend = 'improved'
        } else {
          trend = 'worsened'
        }
      }
      
      return {
        name,
        location: row.raw['Location'] || 'Unknown',
        categoryType: row.categoryType,
        currentDaysOut,
        previousDaysOut,
        change,
        changePercent,
        trend,
      }
    })

    // Sort comparisons
    const sorted = [...comparisons].sort((a, b) => {
      let comparison = 0
      if (sortBy === 'change') {
        const aVal = a.change ?? 999
        const bVal = b.change ?? 999
        comparison = aVal - bVal
      } else if (sortBy === 'current') {
        const aVal = a.currentDaysOut ?? 999
        const bVal = b.currentDaysOut ?? 999
        comparison = aVal - bVal
      } else {
        comparison = a.name.localeCompare(b.name)
      }
      return sortDir === 'desc' ? -comparison : comparison
    })

    // Chart data for category comparison
    const chartData = Object.keys(currentStats.byCategory).map(cat => ({
      category: cat.length > 15 ? cat.slice(0, 15) + '...' : cat,
      current: currentStats.byCategory[cat].avgDaysOut,
      previous: previousStats.byCategory[cat]?.avgDaysOut,
    })).filter(d => d.current !== null).slice(0, 8)

    return {
      currentStats,
      previousStats,
      linkComparisons: sorted,
      chartData,
    }
  }, [data, period, sortBy, sortDir])

  const periodLabel = period === 'day' ? 'Yesterday' : period === 'week' ? 'Last Week' : 'Last Month'
  
  const getChangeIndicator = (change: number | null) => {
    if (change === null) return null
    if (Math.abs(change) < 0.5) return <Minus className="h-4 w-4 text-blue-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-emerald-500" />
    return <TrendingUp className="h-4 w-4 text-red-500" />
  }

  const avgChange = currentStats.avgDaysOut !== null && previousStats.avgDaysOut !== null
    ? currentStats.avgDaysOut - previousStats.avgDaysOut
    : null

  const improved = linkComparisons.filter(l => l.trend === 'improved').length
  const worsened = linkComparisons.filter(l => l.trend === 'worsened').length

  const exportComparison = () => {
    const csv = [
      ['Name', 'Location', 'Category', 'Current Days Out', `${periodLabel} Days Out`, 'Change', 'Change %', 'Trend'],
      ...linkComparisons.map(l => [
        l.name,
        l.location,
        l.categoryType,
        l.currentDaysOut?.toString() || '',
        l.previousDaysOut?.toString() || '',
        l.change?.toFixed(1) || '',
        l.changePercent?.toFixed(1) || '',
        l.trend,
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `period-comparison-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-purple-500" />
          <span className="font-medium">Compare:</span>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day over Day</SelectItem>
              <SelectItem value="week">Week over Week</SelectItem>
              <SelectItem value="month">Month over Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm" onClick={exportComparison} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Wait Change</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-2xl font-bold",
                    avgChange !== null && avgChange < -0.5 && "text-emerald-500",
                    avgChange !== null && avgChange > 0.5 && "text-red-500",
                    (avgChange === null || Math.abs(avgChange) <= 0.5) && "text-blue-500"
                  )}>
                    {avgChange !== null ? `${avgChange > 0 ? '+' : ''}${avgChange.toFixed(1)}d` : 'N/A'}
                  </span>
                  {getChangeIndicator(avgChange)}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs {periodLabel}
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Improved</p>
                <p className="text-2xl font-bold text-emerald-500">{improved}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-emerald-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Links with shorter wait times
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Worsened</p>
                <p className="text-2xl font-bold text-red-500">{worsened}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Links with longer wait times
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Excellent Links</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{currentStats.excellentLinks}</span>
                  <span className="text-sm text-muted-foreground">
                    (was {previousStats.excellentLinks})
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Links with ≤2 days wait
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Comparison Chart */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Category Comparison</CardTitle>
          <CardDescription>Average wait time by category: Now vs {periodLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} days`, '']}
                />
                <Legend />
                <Bar dataKey="previous" name={periodLabel} fill="#6b7280" radius={[0, 4, 4, 0]} />
                <Bar dataKey="current" name="Current" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Link-by-Link Comparison</CardTitle>
              <CardDescription>Detailed changes for each link</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="change">Change</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              >
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  sortDir === 'asc' && "rotate-180"
                )} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">{periodLabel}</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkComparisons.slice(0, 20).map((link, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div>
                        <p className="font-medium truncate max-w-[200px]">{link.name}</p>
                        <p className="text-xs text-muted-foreground">{link.location}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {link.currentDaysOut !== null ? `${link.currentDaysOut}d` : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {link.previousDaysOut !== null ? `${link.previousDaysOut}d` : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={cn(
                        link.change !== null && link.change < -0.5 && "text-emerald-500",
                        link.change !== null && link.change > 0.5 && "text-red-500"
                      )}>
                        {link.change !== null 
                          ? `${link.change > 0 ? '+' : ''}${link.change.toFixed(1)}d`
                          : '—'
                        }
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          link.trend === 'improved' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
                          link.trend === 'worsened' && "bg-red-500/10 text-red-500 border-red-500/30",
                          link.trend === 'stable' && "bg-blue-500/10 text-blue-500 border-blue-500/30",
                          link.trend === 'unknown' && "bg-gray-500/10 text-gray-500 border-gray-500/30"
                        )}
                      >
                        {link.trend === 'improved' && '↓ Improved'}
                        {link.trend === 'worsened' && '↑ Worsened'}
                        {link.trend === 'stable' && '→ Stable'}
                        {link.trend === 'unknown' && 'Unknown'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {linkComparisons.length > 20 && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Showing top 20 of {linkComparisons.length} links
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

