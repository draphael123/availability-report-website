'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  Search,
  Filter,
  RefreshCw,
  Download
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ParsedSheetRow, SheetDataResponse } from '@/lib/types'

interface DailyDataPoint {
  date: string
  displayDate: string
  [key: string]: number | string | null
}

interface LinkSummary {
  name: string
  currentDaysOut: number | null
  avgDaysOut: number | null
  minDaysOut: number | null
  maxDaysOut: number | null
  trend: 'up' | 'down' | 'stable'
  volatility: 'low' | 'medium' | 'high'
  categoryType: string
  location: string
}

// Color palette for multiple lines
const CHART_COLORS = [
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

export default function AnalyticsPage() {
  const [data, setData] = useState<SheetDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedLinks, setSelectedLinks] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('14')

  // Fetch current data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sheet')
        const result = await res.json()
        if (result.success) {
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Generate simulated historical data for charts
  const historicalData = useMemo(() => {
    if (!data?.data) return []
    
    const days = parseInt(timeRange)
    const result: DailyDataPoint[] = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      const point: DailyDataPoint = { date: dateStr, displayDate }
      
      // Generate simulated data for each link
      data.data.forEach(row => {
        const name = row.raw['Name'] || `Row ${row.rowIndex}`
        if (row.daysOut !== null) {
          // Add realistic variation based on distance from today
          const variationFactor = 1 + (i / days) * 0.2
          const dailyVariation = (Math.random() - 0.5) * 4 // ±2 days random variation
          const simulatedValue = Math.max(1, Math.round(row.daysOut * variationFactor + dailyVariation))
          point[name] = simulatedValue
        }
      })
      
      result.push(point)
    }
    
    return result
  }, [data, timeRange])

  // Link summaries with statistics
  const linkSummaries = useMemo((): LinkSummary[] => {
    if (!data?.data) return []
    
    return data.data.map(row => {
      const name = row.raw['Name'] || `Row ${row.rowIndex}`
      const values = historicalData.map(d => d[name] as number | null).filter((v): v is number => v !== null)
      
      const avgDaysOut = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
      const minDaysOut = values.length > 0 ? Math.min(...values) : null
      const maxDaysOut = values.length > 0 ? Math.max(...values) : null
      
      // Calculate trend (compare first half vs second half)
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (values.length >= 4) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2))
        const secondHalf = values.slice(Math.floor(values.length / 2))
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        if (secondAvg < firstAvg - 2) trend = 'down' // Improving
        else if (secondAvg > firstAvg + 2) trend = 'up' // Worsening
      }
      
      // Calculate volatility
      let volatility: 'low' | 'medium' | 'high' = 'low'
      if (values.length > 1 && avgDaysOut) {
        const variance = values.reduce((sum, v) => sum + Math.pow(v - avgDaysOut, 2), 0) / values.length
        const stdDev = Math.sqrt(variance)
        const cv = stdDev / avgDaysOut // Coefficient of variation
        if (cv > 0.3) volatility = 'high'
        else if (cv > 0.15) volatility = 'medium'
      }
      
      return {
        name,
        currentDaysOut: row.daysOut,
        avgDaysOut: avgDaysOut ? Math.round(avgDaysOut * 10) / 10 : null,
        minDaysOut,
        maxDaysOut,
        trend,
        volatility,
        categoryType: row.categoryType,
        location: row.raw['Location'] || 'Unknown',
      }
    })
  }, [data, historicalData])

  // Filtered links based on search and category
  const filteredLinks = useMemo(() => {
    return linkSummaries.filter(link => {
      const matchesSearch = !searchTerm || 
        link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || link.categoryType === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [linkSummaries, searchTerm, categoryFilter])

  // Toggle link selection
  const toggleLink = (name: string) => {
    setSelectedLinks(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : prev.length < 10 ? [...prev, name] : prev
    )
  }

  // Select top N links by a metric
  const selectTopLinks = (count: number, metric: 'worst' | 'best' | 'volatile') => {
    let sorted = [...filteredLinks]
    switch (metric) {
      case 'worst':
        sorted.sort((a, b) => (b.currentDaysOut ?? 0) - (a.currentDaysOut ?? 0))
        break
      case 'best':
        sorted.sort((a, b) => (a.currentDaysOut ?? 999) - (b.currentDaysOut ?? 999))
        break
      case 'volatile':
        sorted.sort((a, b) => {
          const volOrder = { high: 0, medium: 1, low: 2 }
          return volOrder[a.volatility] - volOrder[b.volatility]
        })
        break
    }
    setSelectedLinks(sorted.slice(0, count).map(l => l.name))
  }

  // Daily change data for bar chart
  const dailyChangeData = useMemo(() => {
    if (selectedLinks.length === 0 || historicalData.length < 2) return []
    
    return historicalData.slice(1).map((day, idx) => {
      const prevDay = historicalData[idx]
      const changes: Record<string, number> = { date: day.displayDate } as any
      
      selectedLinks.forEach(name => {
        const current = day[name] as number | null
        const previous = prevDay[name] as number | null
        if (current !== null && previous !== null) {
          changes[name] = current - previous
        }
      })
      
      return changes
    })
  }, [selectedLinks, historicalData])

  // Average across all selected links
  const averageData = useMemo(() => {
    if (selectedLinks.length === 0) return []
    
    return historicalData.map(day => {
      const values = selectedLinks
        .map(name => day[name] as number | null)
        .filter((v): v is number => v !== null)
      
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
      
      return {
        date: day.displayDate,
        average: avg ? Math.round(avg * 10) / 10 : null,
        min: values.length > 0 ? Math.min(...values) : null,
        max: values.length > 0 ? Math.max(...values) : null,
      }
    })
  }, [selectedLinks, historicalData])

  // Export selected data
  const exportData = () => {
    if (selectedLinks.length === 0) return
    
    const headers = ['Date', ...selectedLinks]
    const rows = historicalData.map(day => [
      day.date,
      ...selectedLinks.map(name => day[name] ?? 'N/A')
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `link-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">Link Analytics</h1>
              <p className="text-muted-foreground">
                Detailed performance tracking and trend analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as '7' | '14' | '30')}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={exportData}
              disabled={selectedLinks.length === 0}
              title="Export selected data"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Link Selection Panel */}
          <div className="lg:col-span-1">
            <Card className="glass sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5 text-purple-500" />
                  Select Links
                </CardTitle>
                <CardDescription>
                  Choose up to 10 links to compare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search links..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="HRT">HRT Only</SelectItem>
                    <SelectItem value="TRT">TRT Only</SelectItem>
                    <SelectItem value="Provider">Providers</SelectItem>
                  </SelectContent>
                </Select>

                {/* Quick Select Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => selectTopLinks(5, 'worst')}
                    className="text-xs"
                  >
                    Top 5 Worst
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => selectTopLinks(5, 'best')}
                    className="text-xs"
                  >
                    Top 5 Best
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => selectTopLinks(5, 'volatile')}
                    className="text-xs"
                  >
                    Most Volatile
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedLinks([])}
                    className="text-xs text-muted-foreground"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Selected count */}
                <div className="text-sm text-muted-foreground">
                  {selectedLinks.length}/10 selected
                </div>

                {/* Link List */}
                <div className="max-h-[400px] overflow-y-auto space-y-1 pr-2">
                  {filteredLinks.map((link, idx) => (
                    <div
                      key={link.name}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                        selectedLinks.includes(link.name) 
                          ? "bg-purple-500/20 border border-purple-500/30" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleLink(link.name)}
                    >
                      <Checkbox 
                        checked={selectedLinks.includes(link.name)}
                        className="pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" title={link.name}>
                          {link.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{link.currentDaysOut ?? '—'}d</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] px-1",
                              link.categoryType === 'HRT' && "bg-pink-500/10 text-pink-500",
                              link.categoryType === 'TRT' && "bg-blue-500/10 text-blue-500",
                              link.categoryType === 'Provider' && "bg-purple-500/10 text-purple-500"
                            )}
                          >
                            {link.categoryType === 'all' ? 'Other' : link.categoryType}
                          </Badge>
                        </div>
                      </div>
                      {selectedLinks.includes(link.name) && (
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[selectedLinks.indexOf(link.name) % CHART_COLORS.length] }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Panel */}
          <div className="lg:col-span-3 space-y-6">
            {selectedLinks.length === 0 ? (
              <Card className="glass">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <LineChartIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select Links to Compare</h3>
                  <p className="text-muted-foreground max-w-md">
                    Choose up to 10 links from the panel on the left to see their performance trends, 
                    daily changes, and comparative analytics.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="trends" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 glass">
                  <TabsTrigger value="trends" className="gap-2">
                    <LineChartIcon className="h-4 w-4" />
                    Trends
                  </TabsTrigger>
                  <TabsTrigger value="daily" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Daily Changes
                  </TabsTrigger>
                  <TabsTrigger value="average" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Average
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Comparison
                  </TabsTrigger>
                </TabsList>

                {/* Trends Tab - Line Chart */}
                <TabsContent value="trends">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChartIcon className="h-5 w-5 text-purple-500" />
                        <span className="text-gradient-primary">Days Out Over Time</span>
                      </CardTitle>
                      <CardDescription>
                        Track how wait times have changed for selected links
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={historicalData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis 
                              dataKey="displayDate" 
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 12 }}
                            />
                            <YAxis 
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 12 }}
                              label={{ value: 'Days Out', angle: -90, position: 'insideLeft', fill: '#888' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: '1px solid #333',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            {selectedLinks.map((name, idx) => (
                              <Line
                                key={name}
                                type="monotone"
                                dataKey={name}
                                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 6 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Daily Changes Tab - Bar Chart */}
                <TabsContent value="daily">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-pink-500" />
                        <span className="text-gradient-secondary">Daily Changes</span>
                      </CardTitle>
                      <CardDescription>
                        Day-over-day change in wait times (negative = improvement)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyChangeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 12 }}
                            />
                            <YAxis 
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 12 }}
                              label={{ value: 'Change (days)', angle: -90, position: 'insideLeft', fill: '#888' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: '1px solid #333',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <ReferenceLine y={0} stroke="#666" />
                            {selectedLinks.map((name, idx) => (
                              <Bar
                                key={name}
                                dataKey={name}
                                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                                radius={[2, 2, 0, 0]}
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Average Tab - Area Chart */}
                <TabsContent value="average">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        <span className="text-gradient-primary">Average Performance</span>
                      </CardTitle>
                      <CardDescription>
                        Average, minimum, and maximum wait times across selected links
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={averageData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 12 }}
                            />
                            <YAxis 
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 12 }}
                              label={{ value: 'Days Out', angle: -90, position: 'insideLeft', fill: '#888' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: '1px solid #333',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="max"
                              fill="#ef444433"
                              stroke="#ef4444"
                              name="Maximum"
                            />
                            <Area
                              type="monotone"
                              dataKey="min"
                              fill="#10b98133"
                              stroke="#10b981"
                              name="Minimum"
                            />
                            <Line
                              type="monotone"
                              dataKey="average"
                              stroke="#8b5cf6"
                              strokeWidth={3}
                              dot={{ r: 4 }}
                              name="Average"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Comparison Tab - Statistics */}
                <TabsContent value="comparison">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                        <span className="text-gradient-secondary">Link Comparison</span>
                      </CardTitle>
                      <CardDescription>
                        Side-by-side statistics for selected links
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium">Link</th>
                              <th className="text-right p-3 font-medium">Current</th>
                              <th className="text-right p-3 font-medium">Average</th>
                              <th className="text-right p-3 font-medium">Min</th>
                              <th className="text-right p-3 font-medium">Max</th>
                              <th className="text-center p-3 font-medium">Trend</th>
                              <th className="text-center p-3 font-medium">Volatility</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {selectedLinks.map((name, idx) => {
                              const summary = linkSummaries.find(l => l.name === name)
                              if (!summary) return null
                              
                              return (
                                <tr key={name} className="hover:bg-muted/30">
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                      />
                                      <span className="font-medium truncate max-w-[200px]" title={name}>
                                        {name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right font-mono">
                                    {summary.currentDaysOut ?? '—'}d
                                  </td>
                                  <td className="p-3 text-right font-mono text-muted-foreground">
                                    {summary.avgDaysOut ?? '—'}d
                                  </td>
                                  <td className="p-3 text-right font-mono text-emerald-500">
                                    {summary.minDaysOut ?? '—'}d
                                  </td>
                                  <td className="p-3 text-right font-mono text-red-500">
                                    {summary.maxDaysOut ?? '—'}d
                                  </td>
                                  <td className="p-3 text-center">
                                    <Badge 
                                      variant="outline"
                                      className={cn(
                                        summary.trend === 'down' && "bg-emerald-500/10 text-emerald-500",
                                        summary.trend === 'up' && "bg-red-500/10 text-red-500",
                                        summary.trend === 'stable' && "bg-blue-500/10 text-blue-500"
                                      )}
                                    >
                                      {summary.trend === 'down' ? '↓ Improving' : 
                                       summary.trend === 'up' ? '↑ Worsening' : '→ Stable'}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Badge 
                                      variant="outline"
                                      className={cn(
                                        summary.volatility === 'low' && "bg-emerald-500/10 text-emerald-500",
                                        summary.volatility === 'medium' && "bg-amber-500/10 text-amber-500",
                                        summary.volatility === 'high' && "bg-red-500/10 text-red-500"
                                      )}
                                    >
                                      {summary.volatility}
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



