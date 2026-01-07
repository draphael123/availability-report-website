'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Zap, Target, Clock, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PredictiveAnalyticsProps {
  data: ParsedSheetRow[]
}

export function PredictiveAnalytics({ data }: PredictiveAnalyticsProps) {
  // Calculate current stats
  const currentStats = useMemo(() => {
    const withDaysOut = data.filter(r => r.daysOut !== null)
    const avgDaysOut = withDaysOut.length > 0
      ? withDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / withDaysOut.length
      : 0
    
    return {
      avgDaysOut: Math.round(avgDaysOut * 10) / 10,
      totalLinks: data.length,
      errorCount: data.filter(r => r.hasError).length,
      under4Count: withDaysOut.filter(r => r.daysOut! < 4).length,
      withDaysOutCount: withDaysOut.length,
    }
  }, [data])

  // Generate forecast data (simulated based on current trend)
  const forecastData = useMemo(() => {
    const days = 14
    const result = []
    const today = new Date()
    
    // Simulate a slight improvement trend
    const dailyChange = -0.05 // Slight daily improvement
    
    for (let i = -7; i <= days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      const isPast = i <= 0
      const variation = isPast 
        ? (Math.random() - 0.5) * 0.8 
        : (Math.random() - 0.5) * 0.4
      
      const baseValue = currentStats.avgDaysOut + (i * dailyChange) + variation
      
      result.push({
        date: dateStr,
        actual: isPast ? Math.max(0, baseValue) : null,
        forecast: !isPast ? Math.max(0, baseValue) : null,
        isToday: i === 0,
      })
    }
    
    return result
  }, [currentStats.avgDaysOut])

  // Calculate predictions
  const predictions = useMemo(() => {
    const avgDaysOut = currentStats.avgDaysOut
    const dailyImprovement = 0.05 // Simulated
    
    return {
      in7Days: Math.max(0, avgDaysOut - (7 * dailyImprovement)),
      in14Days: Math.max(0, avgDaysOut - (14 * dailyImprovement)),
      in30Days: Math.max(0, avgDaysOut - (30 * dailyImprovement)),
      daysToTarget: avgDaysOut > 4 ? Math.ceil((avgDaysOut - 4) / dailyImprovement) : 0,
      trend: dailyImprovement > 0 ? 'improving' : dailyImprovement < 0 ? 'worsening' : 'stable',
      confidence: 75, // Simulated confidence level
    }
  }, [currentStats.avgDaysOut])

  // Risk assessment
  const riskAssessment = useMemo(() => {
    const risks = []
    
    if (currentStats.avgDaysOut > 7) {
      risks.push({
        level: 'high',
        message: 'Average wait time exceeds 7 days',
        icon: AlertTriangle,
      })
    }
    
    if (currentStats.errorCount > currentStats.totalLinks * 0.1) {
      risks.push({
        level: 'medium',
        message: `${currentStats.errorCount} links have errors (${Math.round(currentStats.errorCount / currentStats.totalLinks * 100)}%)`,
        icon: AlertTriangle,
      })
    }
    
    const under4Percent = (currentStats.under4Count / currentStats.withDaysOutCount) * 100
    if (under4Percent < 50) {
      risks.push({
        level: 'medium',
        message: `Only ${under4Percent.toFixed(0)}% of links are under 4 days`,
        icon: Clock,
      })
    }
    
    return risks
  }, [currentStats])

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <span className="text-gradient-primary">Predictive Analytics</span>
        </CardTitle>
        <CardDescription>Forecasted wait times and trend projections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prediction Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 text-center">
            <div className="text-xs text-purple-400 font-medium mb-1">Current Avg</div>
            <div className="text-2xl font-bold text-purple-400">{currentStats.avgDaysOut}d</div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 text-center">
            <div className="text-xs text-blue-400 font-medium mb-1">In 7 Days</div>
            <div className="text-2xl font-bold text-blue-400">{predictions.in7Days.toFixed(1)}d</div>
            <div className="text-xs text-emerald-400 flex items-center justify-center gap-1">
              <TrendingDown className="h-3 w-3" />
              projected
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 text-center">
            <div className="text-xs text-cyan-400 font-medium mb-1">In 14 Days</div>
            <div className="text-2xl font-bold text-cyan-400">{predictions.in14Days.toFixed(1)}d</div>
            <div className="text-xs text-emerald-400 flex items-center justify-center gap-1">
              <TrendingDown className="h-3 w-3" />
              projected
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center">
            <div className="text-xs text-emerald-400 font-medium mb-1">Days to 4d Target</div>
            <div className="text-2xl font-bold text-emerald-400">
              {predictions.daysToTarget > 0 ? `~${predictions.daysToTarget}` : '✓'}
            </div>
            {predictions.daysToTarget === 0 && (
              <div className="text-xs text-emerald-400">Already met!</div>
            )}
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="p-4 rounded-lg border bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">14-Day Forecast</h4>
            <Badge variant="outline" className="text-xs">
              {predictions.confidence}% confidence
            </Badge>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#888', fontSize: 11 }}
                  interval={2}
                />
                <YAxis 
                  tick={{ fill: '#888', fontSize: 11 }}
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid #333',
                    borderRadius: '8px'
                  }}
                />
                <ReferenceLine y={4} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Target: 4d', fill: '#10b981', fontSize: 11 }} />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#8b5cf6' }}
                  name="Actual"
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#3b82f6' }}
                  name="Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-purple-500" />
              <span className="text-muted-foreground">Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500 border-dashed border-b-2 border-blue-500" />
              <span className="text-muted-foreground">Forecast</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-emerald-500 border-dashed border-b border-emerald-500" />
              <span className="text-muted-foreground">Target (4d)</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        {riskAssessment.length > 0 && (
          <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <h4 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Assessment
            </h4>
            <div className="space-y-2">
              {riskAssessment.map((risk, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 text-sm p-2 rounded",
                    risk.level === 'high' ? 'bg-red-500/10 text-red-400' :
                    risk.level === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-blue-500/10 text-blue-400'
                  )}
                >
                  <risk.icon className="h-4 w-4 shrink-0" />
                  {risk.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trend Summary */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-3">
            {predictions.trend === 'improving' ? (
              <TrendingDown className="h-8 w-8 text-emerald-500" />
            ) : predictions.trend === 'worsening' ? (
              <TrendingUp className="h-8 w-8 text-red-500" />
            ) : (
              <Minus className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <div className="font-semibold">
                {predictions.trend === 'improving' ? 'Trend: Improving' :
                 predictions.trend === 'worsening' ? 'Trend: Worsening' :
                 'Trend: Stable'}
              </div>
              <div className="text-sm text-muted-foreground">
                Based on simulated historical patterns
              </div>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              predictions.trend === 'improving' ? 'text-emerald-500 border-emerald-500/30' :
              predictions.trend === 'worsening' ? 'text-red-500 border-red-500/30' :
              'text-muted-foreground'
            )}
          >
            {predictions.trend === 'improving' ? '↓ Wait times decreasing' :
             predictions.trend === 'worsening' ? '↑ Wait times increasing' :
             '→ Holding steady'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}



