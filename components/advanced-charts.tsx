'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
  ComposedChart,
  Line,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AdvancedChartsProps {
  data: ParsedSheetRow[]
  categoryType: string
}

const COLORS = [
  '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', 
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#a855f7', '#14b8a6', '#eab308', '#dc2626', '#0ea5e9'
]

const GRADIENT_COLORS = [
  { start: '#8b5cf6', end: '#ec4899' },
  { start: '#3b82f6', end: '#06b6d4' },
  { start: '#10b981', end: '#84cc16' },
  { start: '#f59e0b', end: '#ef4444' },
  { start: '#6366f1', end: '#a855f7' },
]

export function AdvancedCharts({ data, categoryType }: AdvancedChartsProps) {
  // Filter data by category type
  const filteredData = useMemo(() => {
    if (categoryType === 'all') return data
    return data.filter(row => row.categoryType === categoryType)
  }, [data, categoryType])

  // 1. Wait Time Distribution (Histogram-style)
  const distributionData = useMemo(() => {
    const buckets = [
      { range: '0-3 days', min: 0, max: 3, count: 0, color: '#10b981' },
      { range: '4-7 days', min: 4, max: 7, count: 0, color: '#3b82f6' },
      { range: '8-14 days', min: 8, max: 14, count: 0, color: '#8b5cf6' },
      { range: '15-21 days', min: 15, max: 21, count: 0, color: '#f59e0b' },
      { range: '22-30 days', min: 22, max: 30, count: 0, color: '#f97316' },
      { range: '30+ days', min: 31, max: Infinity, count: 0, color: '#ef4444' },
    ]

    filteredData.forEach(row => {
      if (row.daysOut !== null) {
        const bucket = buckets.find(b => row.daysOut! >= b.min && row.daysOut! <= b.max)
        if (bucket) bucket.count++
      }
    })

    return buckets
  }, [filteredData])

  // 2. Category Type Breakdown (Pie Chart)
  const categoryBreakdown = useMemo(() => {
    const counts = { HRT: 0, TRT: 0, Provider: 0, Other: 0 }
    filteredData.forEach(row => {
      if (row.categoryType === 'HRT') counts.HRT++
      else if (row.categoryType === 'TRT') counts.TRT++
      else if (row.categoryType === 'Provider') counts.Provider++
      else counts.Other++
    })
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }))
  }, [filteredData])

  // 3. Location Performance (Horizontal Bar)
  const locationPerformance = useMemo(() => {
    const locationMap = new Map<string, { total: number; sum: number; errors: number }>()
    
    filteredData.forEach(row => {
      const location = row.raw['Location'] || 'Unknown'
      const current = locationMap.get(location) || { total: 0, sum: 0, errors: 0 }
      current.total++
      if (row.daysOut !== null) current.sum += row.daysOut
      if (row.hasError) current.errors++
      locationMap.set(location, current)
    })

    return Array.from(locationMap.entries())
      .map(([location, stats]) => ({
        location,
        avgDaysOut: stats.total > 0 ? Math.round(stats.sum / stats.total * 10) / 10 : 0,
        count: stats.total,
        errorRate: stats.total > 0 ? Math.round((stats.errors / stats.total) * 100) : 0,
      }))
      .sort((a, b) => a.avgDaysOut - b.avgDaysOut)
      .slice(0, 15)
  }, [filteredData])

  // 4. Availability Funnel
  const funnelData = useMemo(() => {
    const total = filteredData.length
    const within7 = filteredData.filter(r => r.daysOut !== null && r.daysOut <= 7).length
    const within14 = filteredData.filter(r => r.daysOut !== null && r.daysOut <= 14).length
    const within30 = filteredData.filter(r => r.daysOut !== null && r.daysOut <= 30).length
    const noErrors = filteredData.filter(r => !r.hasError).length

    return [
      { name: 'Total Links', value: total, fill: '#8b5cf6' },
      { name: 'No Errors', value: noErrors, fill: '#3b82f6' },
      { name: '≤30 Days', value: within30, fill: '#06b6d4' },
      { name: '≤14 Days', value: within14, fill: '#10b981' },
      { name: '≤7 Days', value: within7, fill: '#84cc16' },
    ]
  }, [filteredData])

  // 5. Radar Chart - Category Comparison
  const radarData = useMemo(() => {
    const categories = ['HRT', 'TRT', 'Provider']
    const metrics = ['Avg Days', 'Error Rate', 'Count', 'Within 7d', 'Within 14d']
    
    const categoryStats = categories.map(cat => {
      const catData = data.filter(r => r.categoryType === cat)
      const withDays = catData.filter(r => r.daysOut !== null)
      const avgDays = withDays.length > 0 
        ? withDays.reduce((s, r) => s + r.daysOut!, 0) / withDays.length 
        : 0
      const errorRate = catData.length > 0 
        ? (catData.filter(r => r.hasError).length / catData.length) * 100 
        : 0
      const within7 = catData.filter(r => r.daysOut !== null && r.daysOut <= 7).length
      const within14 = catData.filter(r => r.daysOut !== null && r.daysOut <= 14).length
      
      return {
        category: cat,
        avgDays: Math.min(avgDays, 30), // Cap at 30 for visualization
        errorRate,
        count: catData.length,
        within7,
        within14,
      }
    })

    // Normalize for radar chart
    const maxCount = Math.max(...categoryStats.map(c => c.count), 1)
    const maxWithin7 = Math.max(...categoryStats.map(c => c.within7), 1)
    const maxWithin14 = Math.max(...categoryStats.map(c => c.within14), 1)

    return metrics.map(metric => {
      const point: Record<string, string | number> = { metric }
      categoryStats.forEach(cat => {
        switch (metric) {
          case 'Avg Days':
            point[cat.category] = Math.round((30 - cat.avgDays) / 30 * 100) // Invert: lower is better
            break
          case 'Error Rate':
            point[cat.category] = Math.round(100 - cat.errorRate) // Invert: lower is better
            break
          case 'Count':
            point[cat.category] = Math.round((cat.count / maxCount) * 100)
            break
          case 'Within 7d':
            point[cat.category] = Math.round((cat.within7 / maxWithin7) * 100)
            break
          case 'Within 14d':
            point[cat.category] = Math.round((cat.within14 / maxWithin14) * 100)
            break
        }
      })
      return point
    })
  }, [data])

  // 6. Scatter Plot - Days Out vs Error Status
  const scatterData = useMemo(() => {
    return filteredData
      .filter(r => r.daysOut !== null)
      .map(row => ({
        name: row.raw['Name'] || 'Unknown',
        daysOut: row.daysOut,
        availabilityScore: row.availabilityScore ?? 50,
        hasError: row.hasError ? 1 : 0,
        category: row.categoryType,
      }))
  }, [filteredData])

  // 7. Treemap - Links by Category and Location
  const treemapData = useMemo(() => {
    const hierarchy: Record<string, Record<string, number>> = {}
    
    filteredData.forEach(row => {
      const category = row.categoryType === 'all' ? 'Other' : row.categoryType
      const location = row.raw['Location'] || 'Unknown'
      
      if (!hierarchy[category]) hierarchy[category] = {}
      if (!hierarchy[category][location]) hierarchy[category][location] = 0
      hierarchy[category][location]++
    })

    const children = Object.entries(hierarchy).map(([category, locations], catIdx) => ({
      name: category,
      children: Object.entries(locations).map(([location, count]) => ({
        name: location,
        size: count,
        category,
      })),
    }))

    return children
  }, [filteredData])

  // 8. Status Breakdown (Donut)
  const statusBreakdown = useMemo(() => {
    let excellent = 0, good = 0, average = 0, poor = 0, critical = 0, noData = 0

    filteredData.forEach(row => {
      if (row.daysOut === null) noData++
      else if (row.daysOut <= 3) excellent++
      else if (row.daysOut <= 7) good++
      else if (row.daysOut <= 14) average++
      else if (row.daysOut <= 30) poor++
      else critical++
    })

    return [
      { name: 'Excellent (≤3d)', value: excellent, color: '#10b981' },
      { name: 'Good (4-7d)', value: good, color: '#3b82f6' },
      { name: 'Average (8-14d)', value: average, color: '#8b5cf6' },
      { name: 'Poor (15-30d)', value: poor, color: '#f59e0b' },
      { name: 'Critical (30+d)', value: critical, color: '#ef4444' },
    ].filter(s => s.value > 0)
  }, [filteredData])

  // 9. Time to Availability Stacked Area (simulated trend)
  const trendData = useMemo(() => {
    const days = 14
    const result = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      // Simulate historical data with variation
      const variationFactor = 1 + (i / days) * 0.15
      const randomFactor = 0.9 + Math.random() * 0.2
      
      const baseWithin7 = filteredData.filter(r => r.daysOut !== null && r.daysOut <= 7).length
      const baseWithin14 = filteredData.filter(r => r.daysOut !== null && r.daysOut > 7 && r.daysOut <= 14).length
      const baseWithin30 = filteredData.filter(r => r.daysOut !== null && r.daysOut > 14 && r.daysOut <= 30).length
      const baseOver30 = filteredData.filter(r => r.daysOut !== null && r.daysOut > 30).length
      
      result.push({
        date: dateStr,
        '≤7 days': Math.round(baseWithin7 * variationFactor * randomFactor),
        '8-14 days': Math.round(baseWithin14 * variationFactor * (0.9 + Math.random() * 0.2)),
        '15-30 days': Math.round(baseWithin30 * variationFactor * (0.9 + Math.random() * 0.2)),
        '30+ days': Math.round(baseOver30 * variationFactor * (0.9 + Math.random() * 0.2)),
      })
    }
    
    return result
  }, [filteredData])

  // 10. Top/Bottom performers
  const performerData = useMemo(() => {
    const sorted = [...filteredData]
      .filter(r => r.daysOut !== null)
      .sort((a, b) => a.daysOut! - b.daysOut!)
    
    const top5 = sorted.slice(0, 5).map(r => ({
      name: (r.raw['Name'] || 'Unknown').slice(0, 20),
      daysOut: r.daysOut!,
      type: 'Best',
    }))
    
    const bottom5 = sorted.slice(-5).reverse().map(r => ({
      name: (r.raw['Name'] || 'Unknown').slice(0, 20),
      daysOut: r.daysOut!,
      type: 'Worst',
    }))
    
    return { top5, bottom5 }
  }, [filteredData])

  const categoryLabel = categoryType === 'all' ? 'All Categories' : categoryType

  return (
    <div className="space-y-6">
      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="distribution" className="text-xs">Distribution</TabsTrigger>
          <TabsTrigger value="breakdown" className="text-xs">Breakdown</TabsTrigger>
          <TabsTrigger value="locations" className="text-xs">Locations</TabsTrigger>
          <TabsTrigger value="funnel" className="text-xs">Funnel</TabsTrigger>
          <TabsTrigger value="radar" className="text-xs">Comparison</TabsTrigger>
          <TabsTrigger value="scatter" className="text-xs">Scatter</TabsTrigger>
          <TabsTrigger value="trend" className="text-xs">Trend</TabsTrigger>
          <TabsTrigger value="performers" className="text-xs">Top/Bottom</TabsTrigger>
        </TabsList>

        {/* Distribution Tab */}
        <TabsContent value="distribution">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg text-gradient-primary">Wait Time Distribution</CardTitle>
                <CardDescription>Number of links by wait time range ({categoryLabel})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="range" tick={{ fill: '#888', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg text-gradient-secondary">Status Breakdown</CardTitle>
                <CardDescription>Links by availability status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg text-gradient-primary">Category Distribution</CardTitle>
                <CardDescription>Links by category type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg text-gradient-secondary">Error vs Success</CardTitle>
                <CardDescription>Links with and without errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'No Errors', value: filteredData.filter(r => !r.hasError).length, color: '#10b981' },
                          { name: 'Has Errors', value: filteredData.filter(r => r.hasError).length, color: '#ef4444' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg text-gradient-primary">Performance by Location</CardTitle>
              <CardDescription>Average wait time and link count by location (top 15)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    layout="vertical"
                    data={locationPerformance}
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} />
                    <YAxis dataKey="location" type="category" tick={{ fill: '#888', fontSize: 11 }} width={90} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="avgDaysOut" name="Avg Days Out" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    <Line type="monotone" dataKey="count" name="Link Count" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg text-gradient-secondary">Availability Funnel</CardTitle>
              <CardDescription>How links progress through availability tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                    />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
                      <LabelList position="center" fill="#fff" stroke="none" dataKey="value" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Radar Tab */}
        <TabsContent value="radar">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg text-gradient-primary">Category Comparison</CardTitle>
              <CardDescription>Multi-dimensional comparison of HRT, TRT, and Provider performance (higher is better)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#444" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#888', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#888', fontSize: 10 }} />
                    <Radar name="HRT" dataKey="HRT" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                    <Radar name="TRT" dataKey="TRT" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Radar name="Provider" dataKey="Provider" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    <Legend />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scatter Tab */}
        <TabsContent value="scatter">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg text-gradient-secondary">Days Out vs Availability Score</CardTitle>
              <CardDescription>Each point represents a link - hover for details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      type="number" 
                      dataKey="daysOut" 
                      name="Days Out"
                      tick={{ fill: '#888', fontSize: 11 }}
                      label={{ value: 'Days Out', position: 'bottom', fill: '#888' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="availabilityScore" 
                      name="Score"
                      tick={{ fill: '#888', fontSize: 11 }}
                      label={{ value: 'Availability Score', angle: -90, position: 'insideLeft', fill: '#888' }}
                    />
                    <ZAxis type="number" dataKey="hasError" range={[50, 200]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                      formatter={(value: any, name: string) => [value, name]}
                      labelFormatter={(label) => {
                        const point = scatterData.find(d => d.daysOut === label)
                        return point?.name || ''
                      }}
                    />
                    <Scatter 
                      name="Links" 
                      data={scatterData} 
                      fill="#8b5cf6"
                    >
                      {scatterData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.hasError ? '#ef4444' : '#10b981'} 
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">No Errors</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Has Errors</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Tab */}
        <TabsContent value="trend">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg text-gradient-primary">Availability Trend (14 Days)</CardTitle>
              <CardDescription>Simulated trend of links by wait time category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="≤7 days" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                    <Area type="monotone" dataKey="8-14 days" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} />
                    <Area type="monotone" dataKey="15-30 days" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.8} />
                    <Area type="monotone" dataKey="30+ days" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performers Tab */}
        <TabsContent value="performers">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-400">🏆 Top 5 Performers</CardTitle>
                <CardDescription>Links with lowest wait times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performerData.top5} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#888', fontSize: 11 }} width={120} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                      />
                      <Bar dataKey="daysOut" fill="#10b981" radius={[0, 4, 4, 0]} name="Days Out" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-red-500/30">
              <CardHeader>
                <CardTitle className="text-lg text-red-400">⚠️ Bottom 5 Performers</CardTitle>
                <CardDescription>Links needing attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performerData.bottom5} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#888', fontSize: 11 }} width={120} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                      />
                      <Bar dataKey="daysOut" fill="#ef4444" radius={[0, 4, 4, 0]} name="Days Out" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

