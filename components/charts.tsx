'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryChartData, WeeklyTrendData, CategoryType } from '@/lib/types'

interface ChartsProps {
  data: CategoryChartData[]
  weeklyTrend: WeeklyTrendData[]
  categoryType: CategoryType
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

export function Charts({ data, weeklyTrend, categoryType }: ChartsProps) {
  // Filter to top 10 categories for readability
  const topData = data.slice(0, 10)

  // Get the main color based on category type
  const mainColor = categoryType === 'HRT' ? COLORS.hrt 
    : categoryType === 'TRT' ? COLORS.trt 
    : categoryType === 'Provider' ? COLORS.provider 
    : COLORS.primary

  const categoryLabel = categoryType === 'all' ? 'All Categories' : categoryType

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

      {/* Average Days Out by Category */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Avg Days Out by Category</span>
          </CardTitle>
          <CardDescription>
            Average days out value per category ({categoryLabel}, top 10)
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

      {/* Weekly Trend - Total Rows */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Last 7 Days - Row Count</span>
          </CardTitle>
          <CardDescription>
            Number of rows scraped each day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyTrend}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.6}/>
                    <stop offset="100%" stopColor={COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalRows"
                  stroke={COLORS.success}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  name="Total Rows"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend - By Category Type */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full gradient-rainbow" />
            <span className="text-gradient-primary">Last 7 Days - By Type</span>
          </CardTitle>
          <CardDescription>
            Breakdown by HRT, TRT, and Provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyTrend}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="hrtCount"
                  stroke={COLORS.hrt}
                  strokeWidth={3}
                  dot={{ fill: COLORS.hrt, strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 8, fill: COLORS.hrt }}
                  name="HRT"
                />
                <Line
                  type="monotone"
                  dataKey="trtCount"
                  stroke={COLORS.trt}
                  strokeWidth={3}
                  dot={{ fill: COLORS.trt, strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 8, fill: COLORS.trt }}
                  name="TRT"
                />
                <Line
                  type="monotone"
                  dataKey="providerCount"
                  stroke={COLORS.provider}
                  strokeWidth={3}
                  dot={{ fill: COLORS.provider, strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 8, fill: COLORS.provider }}
                  name="Provider"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend - Avg Days Out */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Last 7 Days - Avg Days Out</span>
          </CardTitle>
          <CardDescription>
            Average days out trend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyTrend.filter(d => d.avgDaysOut !== null)}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorDaysOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.warning} stopOpacity={0.6}/>
                    <stop offset="50%" stopColor={COLORS.orange} stopOpacity={0.3}/>
                    <stop offset="100%" stopColor={COLORS.orange} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  }}
                  formatter={(value: number) => [value?.toFixed(1), 'Avg Days Out']}
                />
                <Area
                  type="monotone"
                  dataKey="avgDaysOut"
                  stroke={COLORS.warning}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDaysOut)"
                  name="Avg Days Out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend - Errors */}
      <Card className="card-hover glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500" />
            <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Last 7 Days - Errors</span>
          </CardTitle>
          <CardDescription>
            Number of errors detected each day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyTrend}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.accent} stopOpacity={1}/>
                    <stop offset="100%" stopColor={COLORS.hrt} stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  }}
                />
                <Bar
                  dataKey="errorCount"
                  fill="url(#errorGradient)"
                  radius={[8, 8, 0, 0]}
                  name="Errors"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <Card className="md:col-span-2 card-hover glass">
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
