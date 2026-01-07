'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryChartData } from '@/lib/types'

interface ChartsProps {
  data: CategoryChartData[]
}

export function Charts({ data }: ChartsProps) {
  // Filter to top 10 categories for readability
  const topData = data.slice(0, 10)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Count by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rows by Category</CardTitle>
          <CardDescription>
            Number of entries per category (top 10)
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
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
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
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                  name="Row Count"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Average Days Out by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Avg Days Out by Category</CardTitle>
          <CardDescription>
            Average days out value per category (top 10)
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
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
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
                  fill="hsl(220, 70%, 65%)"
                  radius={[0, 4, 4, 0]}
                  name="Avg Days Out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Category Summary</CardTitle>
          <CardDescription>
            Overview of all {data.length} categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">
                {data.reduce((sum, d) => sum + d.count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{data.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">
                {data[0]?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Largest ({data[0]?.category?.substring(0, 10) || 'N/A'})
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">
                {(() => {
                  const withDays = data.filter(d => d.avgDaysOut !== null)
                  if (withDays.length === 0) return 'N/A'
                  const avg = withDays.reduce((sum, d) => sum + (d.avgDaysOut || 0), 0) / withDays.length
                  return avg.toFixed(1)
                })()}
              </div>
              <div className="text-sm text-muted-foreground">Avg Days Out (Overall)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

