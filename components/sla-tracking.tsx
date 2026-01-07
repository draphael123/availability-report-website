'use client'

import { useMemo, useState } from 'react'
import { Target, CheckCircle2, AlertTriangle, XCircle, Settings, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SLATrackingProps {
  data: ParsedSheetRow[]
}

interface SLATarget {
  category: string
  targetDays: number
  label: string
  color: string
}

const DEFAULT_SLAS: SLATarget[] = [
  { category: 'HRT', targetDays: 5, label: 'HRT Target', color: 'pink' },
  { category: 'TRT', targetDays: 5, label: 'TRT Target', color: 'blue' },
  { category: 'Provider', targetDays: 7, label: 'Provider Target', color: 'purple' },
  { category: 'all', targetDays: 7, label: 'Overall Target', color: 'emerald' },
]

export function SLATracking({ data }: SLATrackingProps) {
  const [slaTargets] = useState<SLATarget[]>(DEFAULT_SLAS)

  const slaMetrics = useMemo(() => {
    return slaTargets.map(sla => {
      const categoryData = sla.category === 'all' 
        ? data 
        : data.filter(r => r.categoryType === sla.category)
      
      const withDaysOut = categoryData.filter(r => r.daysOut !== null)
      const meetingSLA = withDaysOut.filter(r => r.daysOut! <= sla.targetDays)
      const violating = withDaysOut.filter(r => r.daysOut! > sla.targetDays)
      const criticalViolations = withDaysOut.filter(r => r.daysOut! > sla.targetDays * 2)
      
      const complianceRate = withDaysOut.length > 0 
        ? (meetingSLA.length / withDaysOut.length) * 100 
        : 0
      
      const avgDaysOut = withDaysOut.length > 0
        ? withDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / withDaysOut.length
        : 0

      // Get worst violators
      const worstViolators = [...violating]
        .sort((a, b) => b.daysOut! - a.daysOut!)
        .slice(0, 3)
        .map(r => ({
          name: r.raw['Name'] || 'Unknown',
          daysOut: r.daysOut!,
          overBy: r.daysOut! - sla.targetDays,
        }))

      return {
        ...sla,
        total: withDaysOut.length,
        meeting: meetingSLA.length,
        violating: violating.length,
        critical: criticalViolations.length,
        complianceRate,
        avgDaysOut,
        worstViolators,
        status: complianceRate >= 90 ? 'excellent' : complianceRate >= 75 ? 'good' : complianceRate >= 50 ? 'warning' : 'critical',
      }
    })
  }, [data, slaTargets])

  const overallCompliance = useMemo(() => {
    const overall = slaMetrics.find(s => s.category === 'all')
    return overall?.complianceRate ?? 0
  }, [slaMetrics])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'good': return <CheckCircle2 className="h-5 w-5 text-blue-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
      case 'good': return 'text-blue-500 bg-blue-500/10 border-blue-500/30'
      case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/30'
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30'
      default: return ''
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span className="text-gradient-primary">SLA & Target Tracking</span>
            </CardTitle>
            <CardDescription>Performance against wait time targets</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gradient-secondary">{overallCompliance.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Overall Compliance</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SLA Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {slaMetrics.map((sla) => (
            <div
              key={sla.category}
              className={cn(
                "p-4 rounded-lg border transition-all hover:scale-[1.02]",
                getStatusColor(sla.status)
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{sla.label}</span>
                {getStatusIcon(sla.status)}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium">≤{sla.targetDays} days</span>
                </div>
                
                <Progress 
                  value={sla.complianceRate} 
                  className="h-2"
                />
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Compliance</span>
                  <span className="font-bold">{sla.complianceRate.toFixed(0)}%</span>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{sla.meeting} meeting</span>
                  <span>{sla.violating} violating</span>
                </div>
                
                {sla.critical > 0 && (
                  <Badge variant="destructive" className="text-xs w-full justify-center">
                    {sla.critical} critical ({'>'}2x target)
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Violations Summary */}
        <div className="border rounded-lg p-4 bg-red-500/5 border-red-500/20">
          <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Top SLA Violations
          </h4>
          <div className="grid md:grid-cols-3 gap-4">
            {slaMetrics
              .filter(s => s.category !== 'all' && s.worstViolators.length > 0)
              .map(sla => (
                <div key={sla.category} className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">{sla.label}</div>
                  {sla.worstViolators.map((v, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-background/50 rounded p-2">
                      <span className="truncate max-w-[150px]" title={v.name}>{v.name}</span>
                      <Badge variant="outline" className="text-red-400 border-red-400/30">
                        +{v.overBy}d over
                      </Badge>
                    </div>
                  ))}
                  {sla.worstViolators.length === 0 && (
                    <div className="text-sm text-emerald-400">✓ All meeting target</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

