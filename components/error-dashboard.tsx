'use client'

import { useMemo } from 'react'
import { AlertTriangle, AlertCircle, Clock, MapPin, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

interface ErrorDashboardProps {
  data: ParsedSheetRow[]
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

export function ErrorDashboard({ data }: ErrorDashboardProps) {
  const errorData = useMemo(() => {
    const errors = data.filter(r => r.hasError)
    
    // Group by error code/type
    const errorTypes = new Map<string, number>()
    const errorsByLocation = new Map<string, number>()
    const errorsByCategory = new Map<string, number>()
    
    errors.forEach(row => {
      const errorCode = row.raw['Error Code'] || row.raw['Error Details'] || 'Unknown Error'
      const location = row.raw['Location'] || 'Unknown'
      const category = row.raw['Category'] || 'Unknown'
      
      errorTypes.set(errorCode, (errorTypes.get(errorCode) || 0) + 1)
      errorsByLocation.set(location, (errorsByLocation.get(location) || 0) + 1)
      errorsByCategory.set(category, (errorsByCategory.get(category) || 0) + 1)
    })
    
    return {
      total: errors.length,
      rate: data.length > 0 ? ((errors.length / data.length) * 100).toFixed(1) : '0',
      byType: Array.from(errorTypes.entries())
        .map(([name, value]) => ({ name: name.slice(0, 30), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      byLocation: Array.from(errorsByLocation.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      byCategory: Array.from(errorsByCategory.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      recentErrors: errors.slice(0, 10),
    }
  }, [data])

  if (errorData.total === 0) {
    return (
      <Card className="glass border-emerald-500/30">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Activity className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-500">All Systems Operational</h3>
            <p className="text-sm text-muted-foreground mt-2">
              No errors detected in the current data set
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Errors</p>
                <p className="text-3xl font-bold text-red-500">{errorData.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-3xl font-bold text-amber-500">{errorData.rate}%</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Affected Locations</p>
                <p className="text-3xl font-bold text-purple-500">{errorData.byLocation.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Types</p>
                <p className="text-3xl font-bold text-blue-500">{errorData.byType.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Error Types Pie Chart */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg">Errors by Type</CardTitle>
            <CardDescription>Distribution of error types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={errorData.byType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {errorData.byType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Errors by Location */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg">Errors by Location</CardTitle>
            <CardDescription>Top locations with errors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorData.byLocation} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Recent Errors
          </CardTitle>
          <CardDescription>Latest error occurrences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {errorData.recentErrors.map((row, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10"
              >
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">
                      {row.raw['Name'] || 'Unknown Link'}
                    </span>
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 text-xs">
                      {row.raw['Error Code'] || 'Error'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {row.raw['Error Details'] || 'No details available'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{row.raw['Location'] || 'Unknown'}</span>
                    <span className="mx-1">•</span>
                    <span>{row.raw['Category'] || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

