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
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryChartData, WeeklyTrendData, CategoryType } from '@/lib/types'

interface ChartsProps {
  data: CategoryChartData[]
  weeklyTrend: WeeklyTrendData[]
  categoryType: CategoryType
}

const COLORS = {
  primary: 'hsl(262, 83%, 58%)',
  secondary: 'hsl(199, 89%, 48%)',
  accent: 'hsl(339, 90%, 51%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  hrt: 'hsl(339, 90%, 51%)',
  trt: 'hsl(199, 89%, 48%)',
  provider: 'hsl(262, 83%, 58%)',
}

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
      {/* Count by Category */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: mainColor }} />
            Rows by Category
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
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} opacity={0.3} />
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
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar
                  dataKey="count"
                  fill={mainColor}
                  radius={[0, 4, 4, 0]}
                  name="Row Count"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Average Days Out by Category */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.secondary }} />
            Avg Days Out by Category
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
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} opacity={0.3} />
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
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(value: number) => [value.toFixed(1), 'Avg Days Out']}
                />
                <Bar
                  dataKey="avgDaysOut"
                  fill={COLORS.secondary}
                  radius={[0, 4, 4, 0]}
                  name="Avg Days Out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend - Total Rows */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.success }} />
            Last 7 Days - Row Count Trend
          </CardTitle>
          <CardDescription>
            Number of rows scraped each day over the past week
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
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalRows"
                  stroke={COLORS.success}
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
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full gradient-primary" />
            Last 7 Days - By Type
          </CardTitle>
          <CardDescription>
            Breakdown by HRT, TRT, and Provider each day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyTrend}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="hrtCount"
                  stroke={COLORS.hrt}
                  strokeWidth={2}
                  dot={{ fill: COLORS.hrt }}
                  name="HRT"
                />
                <Line
                  type="monotone"
                  dataKey="trtCount"
                  stroke={COLORS.trt}
                  strokeWidth={2}
                  dot={{ fill: COLORS.trt }}
                  name="TRT"
                />
                <Line
                  type="monotone"
                  dataKey="providerCount"
                  stroke={COLORS.provider}
                  strokeWidth={2}
                  dot={{ fill: COLORS.provider }}
                  name="Provider"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend - Avg Days Out */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.warning }} />
            Last 7 Days - Avg Days Out
          </CardTitle>
          <CardDescription>
            Average days out over the past week
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
                    <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value?.toFixed(1), 'Avg Days Out']}
                />
                <Area
                  type="monotone"
                  dataKey="avgDaysOut"
                  stroke={COLORS.warning}
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
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.accent }} />
            Last 7 Days - Error Count
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
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="errorCount"
                  fill={COLORS.accent}
                  radius={[4, 4, 0, 0]}
                  name="Errors"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <Card className="md:col-span-2 card-hover">
        <CardHeader>
          <CardTitle className="text-lg">Category Summary</CardTitle>
          <CardDescription>
            Overview of {categoryLabel} - {data.length} categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="stat-card-purple rounded-lg p-4 border">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {data.reduce((sum, d) => sum + d.count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="stat-card-blue rounded-lg p-4 border">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="stat-card-pink rounded-lg p-4 border">
              <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {data[0]?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                Largest ({data[0]?.category?.substring(0, 12) || 'N/A'})
              </div>
            </div>
            <div className="stat-card-green rounded-lg p-4 border">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
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
