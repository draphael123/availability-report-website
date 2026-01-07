'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryChartData, WeeklyTrendData, CategoryType, ParsedSheetRow } from '@/lib/types'
import { calculateLocationChartData } from '@/lib/sheet-parser'

interface ChartsProps {
  data: CategoryChartData[]
  locationData?: CategoryChartData[]
  weeklyTrend: WeeklyTrendData[]
  categoryType: CategoryType
  filteredRows?: ParsedSheetRow[]
}

// Vibrant color palette
const COLORS = {
  primary: '#a855f7',    // Purple 500
  secondary: '#06b6d4',  // Cyan 500
  accent: '#f43f5e',     // Rose 500
  success: '#10b981',    // Emerald 500
  warning: '#f59e0b',    // Amber 500
  hrt: '#ec4899',        // Pink 500
  trt: '#3b82f6',        // Blue 500
  provider: '#8b5cf6',   // Violet 500
  orange: '#f97316',     // Orange 500
}

// Rainbow palette for bar charts
const RAINBOW = [
  '#a855f7', // purple
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#6366f1', // indigo
]

export function Charts({ data, locationData, categoryType, filteredRows }: ChartsProps) {
  // Calculate location data if not provided but we have filtered rows
  const locationChartData = locationData || (filteredRows ? calculateLocationChartData(filteredRows) : [])
  
  // Filter to top 10 for readability
  const topData = data.slice(0, 10)
  const topLocationData = locationChartData.slice(0, 10)

  const categoryLabel = categoryType === 'all' ? 'All Categories' : categoryType

  // Calculate wait time distribution from filtered rows
  const waitTimeDistribution = useMemo(() => {
    if (!filteredRows) return []
    
    const distribution = [
      { range: '<2 days', count: 0, color: '#10b981' },
      { range: '2-4 days', count: 0, color: '#3b82f6' },
      { range: '4-7 days', count: 0, color: '#f59e0b' },
      { range: '7-14 days', count: 0, color: '#f97316' },
      { range: '14+ days', count: 0, color: '#ef4444' },
    ]
    
    filteredRows.forEach(row => {
      if (row.daysOut === null) return
      if (row.daysOut < 2) distribution[0].count++
      else if (row.daysOut < 4) distribution[1].count++
      else if (row.daysOut < 7) distribution[2].count++
      else if (row.daysOut < 14) distribution[3].count++
      else distribution[4].count++
    })
    
    return distribution
  }, [filteredRows])

  // Calculate category type breakdown (HRT/TRT/Provider)
  const categoryTypeBreakdown = useMemo(() => {
    if (!filteredRows) return []
    
    const hrt = filteredRows.filter(r => r.categoryType === 'HRT').length
    const trt = filteredRows.filter(r => r.categoryType === 'TRT').length
    const provider = filteredRows.filter(r => r.categoryType === 'Provider').length
    const other = filteredRows.filter(r => r.categoryType === 'all').length
    
    return [
      { name: 'HRT', value: hrt, color: COLORS.hrt },
      { name: 'TRT', value: trt, color: COLORS.trt },
      { name: 'Provider', value: provider, color: COLORS.provider },
      ...(other > 0 ? [{ name: 'Other', value: other, color: '#6b7280' }] : []),
    ].filter(d => d.value > 0)
  }, [filteredRows])

  // Calculate avg days out by location
  const avgDaysOutByLocation = useMemo(() => {
    if (!filteredRows) return []
    
    const locationMap = new Map<string, { sum: number; count: number }>()
    
    filteredRows.forEach(row => {
      const location = row.raw['Location'] || 'Unknown'
      if (row.daysOut === null) return
      
      if (!locationMap.has(location)) {
        locationMap.set(location, { sum: 0, count: 0 })
      }
      const data = locationMap.get(location)!
      data.sum += row.daysOut
      data.count++
    })
    
    return Array.from(locationMap.entries())
      .map(([location, data]) => ({
        location,
        avgDaysOut: Math.round((data.sum / data.count) * 10) / 10,
        count: data.count,
      }))
      .sort((a, b) => b.avgDaysOut - a.avgDaysOut)
      .slice(0, 10)
  }, [filteredRows])

  // Calculate error breakdown by category
  const errorsByCategory = useMemo(() => {
    if (!filteredRows) return []
    
    const errorMap = new Map<string, { errors: number; total: number }>()
    
    filteredRows.forEach(row => {
      const category = row.raw['Category'] || 'Unknown'
      
      if (!errorMap.has(category)) {
        errorMap.set(category, { errors: 0, total: 0 })
      }
      const data = errorMap.get(category)!
      data.total++
      if (row.hasError) data.errors++
    })
    
    return Array.from(errorMap.entries())
      .filter(([, data]) => data.errors > 0)
      .map(([category, data]) => ({
        category,
        errors: data.errors,
        errorRate: Math.round((data.errors / data.total) * 100),
      }))
      .sort((a, b) => b.errors - a.errors)
      .slice(0, 10)
  }, [filteredRows])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Count by Category - Rainbow bars */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full gradient-rainbow" />
            <span className="text-gradient-primary">Rows by Category</span>
          </CardTitle>
          <CardDescription>
            Number of entries per category ({categoryLabel}, top 10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <defs>
                  {RAINBOW.map((color, i) => (
                    <linearGradient key={i} id={`barGradient${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={color} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={color} stopOpacity={1}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} opacity={0.2} />
                <XAxis type="number" />
                <YAxis
                  dataKey="category"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    value.length > 15 ? value.substring(0, 15) + '...' : value
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 8, 8, 0]}
                  name="Row Count"
                >
                  {topData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#barGradient${index % RAINBOW.length})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Wait Time Distribution */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" />
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Wait Time Distribution</span>
          </CardTitle>
          <CardDescription>
            Number of links by wait time range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={waitTimeDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  }}
                  formatter={(value: number) => [value, 'Links']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Links">
                  {waitTimeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Average Days Out by Category */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Avg Days Out by Category</span>
          </CardTitle>
          <CardDescription>
            Average wait time per category ({categoryLabel}, top 10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topData.filter(d => d.avgDaysOut !== null)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="daysOutGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} opacity={0.2} />
                <XAxis type="number" />
                <YAxis
                  dataKey="category"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    value.length > 15 ? value.substring(0, 15) + '...' : value
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(value: number) => [value.toFixed(1), 'Avg Days Out']}
                />
                <Bar
                  dataKey="avgDaysOut"
                  fill="url(#daysOutGradient)"
                  radius={[0, 8, 8, 0]}
                  name="Avg Days Out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Type Breakdown (Pie Chart) */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full gradient-rainbow" />
            <span className="text-gradient-primary">Category Type Breakdown</span>
          </CardTitle>
          <CardDescription>
            Distribution of HRT, TRT, and Provider links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {categoryTypeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={2}
                    stroke="rgba(255,255,255,0.2)"
                  >
                    {categoryTypeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    }}
                    formatter={(value: number) => [value, 'Links']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No category type data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rows by Location */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Rows by Location</span>
          </CardTitle>
          <CardDescription>
            Number of entries per location ({categoryLabel}, top 10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {topLocationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topLocationData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    {RAINBOW.map((color, i) => (
                      <linearGradient key={`loc-${i}`} id={`locGradient${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={color} stopOpacity={1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} opacity={0.2} />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="category"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      value.length > 15 ? value.substring(0, 15) + '...' : value
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 8, 8, 0]}
                    name="Row Count"
                  >
                    {topLocationData.map((entry, index) => (
                      <Cell key={`loc-cell-${index}`} fill={`url(#locGradient${index % RAINBOW.length})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No location data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Avg Days Out by Location */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-rose-500 to-orange-500" />
            <span className="bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">Avg Wait by Location</span>
          </CardTitle>
          <CardDescription>
            Locations with longest average wait times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {avgDaysOutByLocation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={avgDaysOutByLocation}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="locationAvgGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#f97316" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} opacity={0.2} />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="location"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      value.length > 15 ? value.substring(0, 15) + '...' : value
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    }}
                    formatter={(value: number, name, props) => {
                      if (name === 'avgDaysOut') return [`${value} days`, 'Avg Wait']
                      return [value, name]
                    }}
                  />
                  <Bar
                    dataKey="avgDaysOut"
                    fill="url(#locationAvgGradient)"
                    radius={[0, 8, 8, 0]}
                    name="Avg Days Out"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No location data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Errors by Category */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500" />
            <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">Errors by Category</span>
          </CardTitle>
          <CardDescription>
            Categories with the most errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {errorsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={errorsByCategory}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="errorBarGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} opacity={0.2} />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="category"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      value.length > 15 ? value.substring(0, 15) + '...' : value
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    }}
                    formatter={(value: number, name, props) => {
                      const item = props.payload
                      return [
                        `${value} errors (${item.errorRate}% error rate)`,
                        'Errors'
                      ]
                    }}
                  />
                  <Bar
                    dataKey="errors"
                    fill="url(#errorBarGradient)"
                    radius={[0, 8, 8, 0]}
                    name="Errors"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-emerald-500 font-medium">
                ✓ No errors detected
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg text-gradient-primary">Category Summary</CardTitle>
          <CardDescription>
            Overview of {categoryLabel} - {data.length} categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="stat-card-purple rounded-xl p-4 border shadow-lg shadow-purple-500/20">
              <div className="text-3xl font-bold text-gradient-primary animate-count">
                {data.reduce((sum, d) => sum + d.count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="stat-card-blue rounded-xl p-4 border shadow-lg shadow-blue-500/20">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent animate-count">
                {data.length}
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="stat-card-pink rounded-xl p-4 border shadow-lg shadow-pink-500/20">
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent animate-count">
                {data[0]?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                Largest ({data[0]?.category?.substring(0, 12) || 'N/A'})
              </div>
            </div>
            <div className="stat-card-green rounded-xl p-4 border shadow-lg shadow-emerald-500/20">
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-count">
                {(() => {
                  const withDays = data.filter(d => d.avgDaysOut !== null)
                  if (withDays.length === 0) return 'N/A'
                  const avg = withDays.reduce((sum, d) => sum + (d.avgDaysOut || 0), 0) / withDays.length
                  return avg.toFixed(1)
                })()}
              </div>
              <div className="text-sm text-muted-foreground">Avg Days Out</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
