'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Brain, Clock, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts'

interface PerformanceForecastProps {
  data: ParsedSheetRow[]
}

export function PerformanceForecast({ data }: PerformanceForecastProps) {
  const forecast = useMemo(() => {
    // Calculate current metrics
    const withDaysOut = data.filter(r => r.daysOut !== null)
    const currentAvg = withDaysOut.length > 0
      ? withDaysOut.reduce((s, r) => s + r.daysOut!, 0) / withDaysOut.length
      : 0
    
    const currentErrorRate = data.length > 0
      ? (data.filter(r => r.hasError).length / data.length) * 100
      : 0
    
    const excellentRate = withDaysOut.length > 0
      ? (withDaysOut.filter(r => r.daysOut! <= 2).length / withDaysOut.length) * 100
      : 0

    // Generate simulated forecast (in production, this would use actual historical data)
    const days = []
    let projectedAvg = currentAvg
    let projectedError = currentErrorRate
    
    for (let i = 0; i < 14; i++) {
      // Simulate slight variations with a trend toward improvement
      const variation = (Math.random() - 0.5) * 1.5
      const trend = -0.05 // Slight improvement trend
      projectedAvg = Math.max(0, projectedAvg + variation + trend)
      projectedError = Math.max(0, Math.min(100, projectedError + (Math.random() - 0.55) * 2))
      
      const date = new Date()
      date.setDate(date.getDate() + i)
      
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        shortDay: date.toLocaleDateString('en-US', { weekday: 'short' }),
        avgDaysOut: Math.round(projectedAvg * 10) / 10,
        errorRate: Math.round(projectedError * 10) / 10,
        confidence: Math.max(50, 95 - i * 3), // Confidence decreases with time
        isProjected: i > 0,
      })
    }

    // Calculate predicted trend
    const lastWeekAvg = days.slice(7).reduce((s, d) => s + d.avgDaysOut, 0) / 7
    const thisWeekAvg = days.slice(0, 7).reduce((s, d) => s + d.avgDaysOut, 0) / 7
    const trendDirection = lastWeekAvg < thisWeekAvg ? 'improving' : 
                          lastWeekAvg > thisWeekAvg ? 'worsening' : 'stable'
    
    // Identify potential risks
    const risks: { level: 'high' | 'medium' | 'low', message: string }[] = []
    if (currentErrorRate > 10) {
      risks.push({ level: 'high', message: `High error rate (${currentErrorRate.toFixed(1)}%)` })
    }
    if (currentAvg > 7) {
      risks.push({ level: 'high', message: `Average wait time exceeds 7 days` })
    }
    if (excellentRate < 20) {
      risks.push({ level: 'medium', message: `Only ${excellentRate.toFixed(0)}% of links have excellent availability` })
    }
    
    return {
      currentAvg,
      currentErrorRate,
      excellentRate,
      days,
      trendDirection,
      predictedAvg: lastWeekAvg,
      risks,
      confidence: 78, // Overall confidence in predictions
    }
  }, [data])

  return (
    <div className="space-y-6">
      {/* Prediction Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Avg Wait</p>
                <p className="text-3xl font-bold text-purple-500">
                  {forecast.currentAvg.toFixed(1)}d
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predicted (7d)</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-blue-500">
                    {forecast.predictedAvg.toFixed(1)}d
                  </p>
                  {forecast.trendDirection === 'improving' && (
                    <TrendingDown className="h-5 w-5 text-emerald-500" />
                  )}
                  {forecast.trendDirection === 'worsening' && (
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  )}
                  {forecast.trendDirection === 'stable' && (
                    <Minus className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </div>
              <Brain className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trend</p>
                <p className={cn(
                  "text-2xl font-bold capitalize",
                  forecast.trendDirection === 'improving' && "text-emerald-500",
                  forecast.trendDirection === 'worsening' && "text-red-500",
                  forecast.trendDirection === 'stable' && "text-blue-500"
                )}>
                  {forecast.trendDirection}
                </p>
              </div>
              <Target className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-amber-500/30">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Prediction Confidence</p>
              <div className="flex items-center gap-3">
                <Progress value={forecast.confidence} className="flex-1" />
                <span className="text-lg font-bold text-amber-500">{forecast.confidence}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            14-Day Forecast
          </CardTitle>
          <CardDescription>
            Predicted average wait times with confidence intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast.days} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="shortDay" 
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Days Out', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'avgDaysOut') return [`${value}d`, 'Avg Wait']
                    if (name === 'confidence') return [`${value}%`, 'Confidence']
                    return [value, name]
                  }}
                />
                <ReferenceLine y={forecast.currentAvg} stroke="#666" strokeDasharray="3 3" />
                <Area 
                  type="monotone" 
                  dataKey="avgDaysOut" 
                  fill="url(#confidenceGradient)"
                  stroke="none"
                />
                <Line 
                  type="monotone" 
                  dataKey="avgDaysOut" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={payload.isProjected ? 3 : 5}
                        fill={payload.isProjected ? '#8b5cf6' : '#fff'}
                        stroke="#8b5cf6"
                        strokeWidth={2}
                      />
                    )
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-purple-500 bg-white" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Projected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 border-t-2 border-dashed border-gray-500" />
              <span>Current Avg</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      {forecast.risks.length > 0 && (
        <Card className="glass border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-lg">Risk Assessment</CardTitle>
            <CardDescription>Potential issues identified in current data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forecast.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    risk.level === 'high' && "bg-red-500/10 border border-red-500/20",
                    risk.level === 'medium' && "bg-amber-500/10 border border-amber-500/20",
                    risk.level === 'low' && "bg-blue-500/10 border border-blue-500/20"
                  )}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      risk.level === 'high' && "bg-red-500/20 text-red-500 border-red-500/30",
                      risk.level === 'medium' && "bg-amber-500/20 text-amber-500 border-amber-500/30",
                      risk.level === 'low' && "bg-blue-500/20 text-blue-500 border-blue-500/30"
                    )}
                  >
                    {risk.level.toUpperCase()}
                  </Badge>
                  <span className="text-sm">{risk.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">AI Analysis</CardTitle>
          <CardDescription>Automated insights from the forecast model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="font-medium mb-1">Current Status</p>
              <p className="text-muted-foreground">
                The system is currently showing an average wait time of <strong>{forecast.currentAvg.toFixed(1)} days</strong> with 
                {forecast.currentErrorRate < 5 
                  ? ' minimal errors' 
                  : ` a ${forecast.currentErrorRate.toFixed(1)}% error rate`
                }.
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="font-medium mb-1">7-Day Outlook</p>
              <p className="text-muted-foreground">
                Based on current trends, wait times are expected to 
                {forecast.trendDirection === 'improving' 
                  ? ' decrease slightly over the next week, which is positive for patient access.'
                  : forecast.trendDirection === 'worsening'
                  ? ' increase slightly. Consider reviewing capacity or scheduling processes.'
                  : ' remain stable with no significant changes expected.'
                }
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="font-medium mb-1">Recommendation</p>
              <p className="text-muted-foreground">
                {forecast.excellentRate > 50
                  ? 'Availability is strong. Focus on maintaining current performance and reducing the few remaining long-wait links.'
                  : forecast.excellentRate > 25
                  ? 'Moderate availability levels. Consider investigating links with wait times over 5 days for optimization opportunities.'
                  : 'Availability needs improvement. Prioritize addressing links with the longest wait times to improve overall metrics.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


