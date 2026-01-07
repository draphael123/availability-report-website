'use client'

import { useMemo } from 'react'
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface VisualKPIsProps {
  data: ParsedSheetRow[]
}

export function VisualKPIs({ data }: VisualKPIsProps) {
  const kpis = useMemo(() => {
    if (!data || data.length === 0) return null

    const withDaysOut = data.filter(r => r.daysOut !== null && !r.hasError)
    const totalLinks = data.length
    const activeLinks = withDaysOut.length
    const errorLinks = data.filter(r => r.hasError).length

    // Calculate averages
    const avgDaysOut = activeLinks > 0 
      ? withDaysOut.reduce((s, r) => s + r.daysOut!, 0) / activeLinks 
      : 0

    // Availability targets
    const within2Days = withDaysOut.filter(r => r.daysOut! <= 2).length
    const within4Days = withDaysOut.filter(r => r.daysOut! <= 4).length
    const within7Days = withDaysOut.filter(r => r.daysOut! <= 7).length

    const pctUnder2 = activeLinks > 0 ? (within2Days / activeLinks) * 100 : 0
    const pctUnder4 = activeLinks > 0 ? (within4Days / activeLinks) * 100 : 0
    const pctUnder7 = activeLinks > 0 ? (within7Days / activeLinks) * 100 : 0

    // Error rate
    const errorRate = totalLinks > 0 ? (errorLinks / totalLinks) * 100 : 0

    // Uptime (inverse of error rate)
    const uptime = 100 - errorRate

    // HRT/TRT/Provider breakdown
    const hrt = data.filter(r => r.categoryType === 'HRT')
    const trt = data.filter(r => r.categoryType === 'TRT')
    const provider = data.filter(r => r.categoryType === 'Provider')

    const hrtAvg = hrt.filter(r => r.daysOut !== null).length > 0
      ? hrt.filter(r => r.daysOut !== null).reduce((s, r) => s + r.daysOut!, 0) / hrt.filter(r => r.daysOut !== null).length
      : null
    const trtAvg = trt.filter(r => r.daysOut !== null).length > 0
      ? trt.filter(r => r.daysOut !== null).reduce((s, r) => s + r.daysOut!, 0) / trt.filter(r => r.daysOut !== null).length
      : null
    const providerAvg = provider.filter(r => r.daysOut !== null).length > 0
      ? provider.filter(r => r.daysOut !== null).reduce((s, r) => s + r.daysOut!, 0) / provider.filter(r => r.daysOut !== null).length
      : null

    return {
      totalLinks,
      activeLinks,
      errorLinks,
      avgDaysOut,
      within2Days,
      within4Days,
      within7Days,
      pctUnder2,
      pctUnder4,
      pctUnder7,
      errorRate,
      uptime,
      hrtAvg,
      trtAvg,
      providerAvg,
      hrtCount: hrt.length,
      trtCount: trt.length,
      providerCount: provider.length,
    }
  }, [data])

  if (!kpis) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Average Wait Time */}
      <Card className="glass border-purple-500/30 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-purple-400" />
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              kpis.avgDaysOut < 3 ? "bg-emerald-500/20 text-emerald-400" :
              kpis.avgDaysOut < 5 ? "bg-blue-500/20 text-blue-400" :
              kpis.avgDaysOut < 7 ? "bg-amber-500/20 text-amber-400" :
              "bg-red-500/20 text-red-400"
            )}>
              {kpis.avgDaysOut < 3 ? 'Excellent' : kpis.avgDaysOut < 5 ? 'Good' : kpis.avgDaysOut < 7 ? 'Fair' : 'Needs Work'}
            </span>
          </div>
          <div className="text-3xl font-bold text-gradient-primary mb-1">
            {kpis.avgDaysOut.toFixed(1)}
            <span className="text-lg text-muted-foreground ml-1">days</span>
          </div>
          <div className="text-xs text-muted-foreground">Average Wait Time</div>
          <Progress 
            value={Math.max(0, 100 - (kpis.avgDaysOut / 14) * 100)} 
            className="h-1.5 mt-3"
          />
        </CardContent>
      </Card>

      {/* Availability Under 4 Days */}
      <Card className="glass border-emerald-500/30 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <Target className="h-5 w-5 text-emerald-400" />
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              kpis.pctUnder4 >= 70 ? "bg-emerald-500/20 text-emerald-400" :
              kpis.pctUnder4 >= 50 ? "bg-blue-500/20 text-blue-400" :
              "bg-amber-500/20 text-amber-400"
            )}>
              {kpis.pctUnder4 >= 70 ? 'On Target' : kpis.pctUnder4 >= 50 ? 'Close' : 'Below Target'}
            </span>
          </div>
          <div className="text-3xl font-bold text-emerald-400 mb-1">
            {kpis.pctUnder4.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">Available in &lt;4 Days</div>
          <Progress 
            value={kpis.pctUnder4} 
            className="h-1.5 mt-3 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-green-500"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {kpis.within4Days} of {kpis.activeLinks} links
          </div>
        </CardContent>
      </Card>

      {/* System Uptime */}
      <Card className="glass border-blue-500/30 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              kpis.uptime >= 95 ? "bg-emerald-500/20 text-emerald-400" :
              kpis.uptime >= 90 ? "bg-blue-500/20 text-blue-400" :
              "bg-amber-500/20 text-amber-400"
            )}>
              {kpis.uptime >= 95 ? 'Healthy' : kpis.uptime >= 90 ? 'Good' : 'Degraded'}
            </span>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {kpis.uptime.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">System Uptime</div>
          <Progress 
            value={kpis.uptime} 
            className="h-1.5 mt-3 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-500"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {kpis.errorLinks} errors out of {kpis.totalLinks} links
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card className="glass border-pink-500/30 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-rose-500" />
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="h-5 w-5 text-pink-400" />
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
              By Category
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-pink-400 font-medium">HRT</span>
              <span className="text-sm font-bold text-pink-400">
                {kpis.hrtAvg !== null ? `${kpis.hrtAvg.toFixed(1)}d` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-400 font-medium">TRT</span>
              <span className="text-sm font-bold text-blue-400">
                {kpis.trtAvg !== null ? `${kpis.trtAvg.toFixed(1)}d` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-400 font-medium">Provider</span>
              <span className="text-sm font-bold text-purple-400">
                {kpis.providerAvg !== null ? `${kpis.providerAvg.toFixed(1)}d` : '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

