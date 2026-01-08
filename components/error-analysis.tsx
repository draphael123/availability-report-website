'use client'

import { useMemo } from 'react'
import { AlertTriangle, Bug, Clock, CheckCircle2, XCircle, BarChart3 } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ErrorAnalysisProps {
  data: ParsedSheetRow[]
}

interface ErrorSummary {
  code: string
  count: number
  percentage: number
  examples: string[]
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e']

export function ErrorAnalysis({ data }: ErrorAnalysisProps) {
  const errorStats = useMemo(() => {
    const errorsOnly = data.filter(r => r.hasError)
    const total = data.length
    const errorCount = errorsOnly.length
    const errorRate = total > 0 ? (errorCount / total) * 100 : 0

    // Group by error code
    const errorByCode = new Map<string, ParsedSheetRow[]>()
    errorsOnly.forEach(row => {
      const code = row.raw['Error Code'] || row.raw['error_code'] || 'Unknown'
      const existing = errorByCode.get(code) || []
      existing.push(row)
      errorByCode.set(code, existing)
    })

    const errorSummaries: ErrorSummary[] = Array.from(errorByCode.entries())
      .map(([code, rows]) => ({
        code,
        count: rows.length,
        percentage: errorCount > 0 ? (rows.length / errorCount) * 100 : 0,
        examples: rows.slice(0, 3).map(r => r.raw['Name'] || 'Unknown'),
      }))
      .sort((a, b) => b.count - a.count)

    // Group by category
    const errorByCategory = {
      HRT: errorsOnly.filter(r => r.categoryType === 'HRT').length,
      TRT: errorsOnly.filter(r => r.categoryType === 'TRT').length,
      Provider: errorsOnly.filter(r => r.categoryType === 'Provider').length,
      Other: errorsOnly.filter(r => r.categoryType === 'all').length,
    }

    // Group by location
    const errorByLocation = new Map<string, number>()
    errorsOnly.forEach(row => {
      const location = row.raw['Location'] || 'Unknown'
      errorByLocation.set(location, (errorByLocation.get(location) || 0) + 1)
    })

    const topErrorLocations = Array.from(errorByLocation.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }))

    return {
      total,
      errorCount,
      errorRate,
      successCount: total - errorCount,
      successRate: total > 0 ? ((total - errorCount) / total) * 100 : 100,
      errorSummaries,
      errorByCategory,
      topErrorLocations,
      errorsOnly,
    }
  }, [data])

  const pieData = [
    { name: 'Success', value: errorStats.successCount, color: '#10b981' },
    { name: 'Errors', value: errorStats.errorCount, color: '#ef4444' },
  ]

  const categoryPieData = Object.entries(errorStats.errorByCategory)
    .filter(([_, count]) => count > 0)
    .map(([name, value], idx) => ({ name, value, color: COLORS[idx % COLORS.length] }))

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bug className="h-5 w-5 text-red-500" />
          <span className="text-gradient-secondary">Error Analysis</span>
        </CardTitle>
        <CardDescription>Detailed breakdown of errors and patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">{errorStats.successRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-400">{errorStats.errorCount}</div>
            <div className="text-xs text-muted-foreground">Total Errors</div>
          </div>
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-400">{errorStats.errorSummaries.length}</div>
            <div className="text-xs text-muted-foreground">Error Types</div>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
            <BarChart3 className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-400">{errorStats.topErrorLocations.length}</div>
            <div className="text-xs text-muted-foreground">Affected Locations</div>
          </div>
        </div>

        {errorStats.errorCount > 0 ? (
          <>
            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Success vs Error Pie */}
              <div className="p-4 rounded-lg border bg-muted/20">
                <h4 className="font-semibold mb-4 text-sm">Success vs Errors</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Errors by Category */}
              <div className="p-4 rounded-lg border bg-muted/20">
                <h4 className="font-semibold mb-4 text-sm">Errors by Category</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryPieData} layout="vertical">
                      <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#888', fontSize: 11 }} width={60} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Error Types Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-3 bg-muted/50 border-b">
                <h4 className="font-semibold text-sm">Error Types Breakdown</h4>
              </div>
              <div className="max-h-[300px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium">Error Code</th>
                      <th className="text-center p-3 font-medium">Count</th>
                      <th className="text-center p-3 font-medium">% of Errors</th>
                      <th className="text-left p-3 font-medium">Affected Links</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {errorStats.errorSummaries.map((error, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-3">
                          <Badge variant="outline" className="text-red-400 border-red-400/30">
                            {error.code}
                          </Badge>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-red-400">
                          {error.count}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500" 
                                style={{ width: `${error.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{error.percentage.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-xs text-muted-foreground">
                            {error.examples.join(', ')}
                            {error.count > 3 && ` +${error.count - 3} more`}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Error Locations */}
            {errorStats.topErrorLocations.length > 0 && (
              <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                <h4 className="font-semibold text-red-400 mb-3">Locations with Most Errors</h4>
                <div className="flex flex-wrap gap-2">
                  {errorStats.topErrorLocations.map((loc, idx) => (
                    <Badge 
                      key={idx}
                      variant="outline" 
                      className="text-red-400 border-red-400/30"
                    >
                      {loc.location}: {loc.count} error{loc.count !== 1 ? 's' : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-emerald-400 mb-2">No Errors Detected!</h3>
            <p className="text-muted-foreground">All {errorStats.total} links are operating without errors.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}




