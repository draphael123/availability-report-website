'use client'

import { useMemo } from 'react'
import { Users, DollarSign, Clock, TrendingUp, AlertTriangle, Heart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PatientImpactProps {
  data: ParsedSheetRow[]
}

// Estimated constants (would be configurable in production)
const AVG_PATIENTS_PER_LINK_PER_WEEK = 15
const REVENUE_PER_APPOINTMENT = 200
const PATIENT_SATISFACTION_BASELINE = 4.5 // out of 5

export function PatientImpact({ data }: PatientImpactProps) {
  const impactMetrics = useMemo(() => {
    const totalLinks = data.length
    const withDaysOut = data.filter(r => r.daysOut !== null)
    const avgDaysOut = withDaysOut.length > 0
      ? withDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / withDaysOut.length
      : 0

    // Calculate estimated patients affected by long waits
    const longWaitLinks = withDaysOut.filter(r => r.daysOut! >= 7)
    const criticalWaitLinks = withDaysOut.filter(r => r.daysOut! >= 14)
    
    // Estimated weekly patients affected
    const patientsAffectedByLongWait = longWaitLinks.length * AVG_PATIENTS_PER_LINK_PER_WEEK
    const patientsAffectedByCriticalWait = criticalWaitLinks.length * AVG_PATIENTS_PER_LINK_PER_WEEK
    
    // Total weekly capacity
    const totalWeeklyCapacity = totalLinks * AVG_PATIENTS_PER_LINK_PER_WEEK

    // Error impact
    const errorLinks = data.filter(r => r.hasError)
    const patientsAffectedByErrors = errorLinks.length * AVG_PATIENTS_PER_LINK_PER_WEEK

    // Revenue impact estimation
    // Assumption: 10% of patients with long waits don't book
    const potentialLostBookings = Math.round(patientsAffectedByLongWait * 0.10)
    const estimatedRevenueLoss = potentialLostBookings * REVENUE_PER_APPOINTMENT

    // Patient satisfaction impact
    // Assumption: Each day over 7 reduces satisfaction by 0.05
    const avgExcessDays = avgDaysOut > 7 ? avgDaysOut - 7 : 0
    const satisfactionImpact = Math.min(avgExcessDays * 0.05, 1.5)
    const estimatedSatisfaction = Math.max(PATIENT_SATISFACTION_BASELINE - satisfactionImpact, 3.0)

    // Opportunity score (how much room for improvement)
    const opportunityScore = Math.round(
      ((longWaitLinks.length / Math.max(withDaysOut.length, 1)) * 40) +
      ((criticalWaitLinks.length / Math.max(withDaysOut.length, 1)) * 40) +
      ((errorLinks.length / Math.max(totalLinks, 1)) * 20)
    )

    // Category breakdown of impact
    const categoryImpact = {
      HRT: {
        links: data.filter(r => r.categoryType === 'HRT'),
        longWait: withDaysOut.filter(r => r.categoryType === 'HRT' && r.daysOut! >= 7).length,
      },
      TRT: {
        links: data.filter(r => r.categoryType === 'TRT'),
        longWait: withDaysOut.filter(r => r.categoryType === 'TRT' && r.daysOut! >= 7).length,
      },
      Provider: {
        links: data.filter(r => r.categoryType === 'Provider'),
        longWait: withDaysOut.filter(r => r.categoryType === 'Provider' && r.daysOut! >= 7).length,
      },
    }

    return {
      totalLinks,
      avgDaysOut: Math.round(avgDaysOut * 10) / 10,
      totalWeeklyCapacity,
      longWaitLinks: longWaitLinks.length,
      criticalWaitLinks: criticalWaitLinks.length,
      patientsAffectedByLongWait,
      patientsAffectedByCriticalWait,
      errorLinks: errorLinks.length,
      patientsAffectedByErrors,
      potentialLostBookings,
      estimatedRevenueLoss,
      estimatedSatisfaction: Math.round(estimatedSatisfaction * 10) / 10,
      opportunityScore,
      categoryImpact,
    }
  }, [data])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <span className="text-gradient-primary">Patient Impact Estimates</span>
        </CardTitle>
        <CardDescription>Estimated effect on patients and operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 text-center">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-400">{impactMetrics.totalWeeklyCapacity}</div>
            <div className="text-xs text-muted-foreground">Est. Weekly Capacity</div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 text-center">
            <Clock className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-400">{impactMetrics.patientsAffectedByLongWait}</div>
            <div className="text-xs text-muted-foreground">Facing 7+ Day Wait</div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 text-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-400">{impactMetrics.patientsAffectedByCriticalWait}</div>
            <div className="text-xs text-muted-foreground">Facing 14+ Day Wait</div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center">
            <TrendingUp className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">{impactMetrics.estimatedSatisfaction}/5</div>
            <div className="text-xs text-muted-foreground">Est. Satisfaction</div>
          </div>
        </div>

        {/* Financial Impact */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold">Financial Impact Estimate</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Potential Lost Bookings/Week</div>
              <div className="text-2xl font-bold text-amber-400">{impactMetrics.potentialLostBookings}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Est. Weekly Revenue Impact</div>
              <div className="text-2xl font-bold text-red-400">{formatCurrency(impactMetrics.estimatedRevenueLoss)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Est. Monthly Impact</div>
              <div className="text-2xl font-bold text-red-400">{formatCurrency(impactMetrics.estimatedRevenueLoss * 4)}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center mt-4">
            *Estimates based on ~{AVG_PATIENTS_PER_LINK_PER_WEEK} patients/link/week, {formatCurrency(REVENUE_PER_APPOINTMENT)}/appointment, 10% churn on long waits
          </div>
        </div>

        {/* Category Impact */}
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(impactMetrics.categoryImpact).map(([category, impact]) => (
            <div 
              key={category}
              className={cn(
                "p-4 rounded-lg border",
                category === 'HRT' && "bg-pink-500/5 border-pink-500/20",
                category === 'TRT' && "bg-blue-500/5 border-blue-500/20",
                category === 'Provider' && "bg-purple-500/5 border-purple-500/20"
              )}
            >
              <div className="font-semibold mb-2">{category}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Links</span>
                  <span className="font-medium">{impact.links.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Long Wait (7+d)</span>
                  <span className={cn("font-medium", impact.longWait > 0 && "text-amber-400")}>
                    {impact.longWait}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Patients Affected</span>
                  <span className="font-medium">{impact.longWait * AVG_PATIENTS_PER_LINK_PER_WEEK}/week</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Opportunity Score */}
        <div className="p-4 rounded-lg border bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">Improvement Opportunity Score</div>
              <div className="text-sm text-muted-foreground">Higher = more room for improvement</div>
            </div>
            <div className={cn(
              "text-3xl font-bold",
              impactMetrics.opportunityScore >= 50 ? "text-red-400" :
              impactMetrics.opportunityScore >= 25 ? "text-amber-400" :
              "text-emerald-400"
            )}>
              {impactMetrics.opportunityScore}
            </div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all",
                impactMetrics.opportunityScore >= 50 ? "bg-red-500" :
                impactMetrics.opportunityScore >= 25 ? "bg-amber-500" :
                "bg-emerald-500"
              )}
              style={{ width: `${impactMetrics.opportunityScore}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Optimized</span>
            <span>Needs Work</span>
          </div>
        </div>

        {/* Action Items */}
        {impactMetrics.opportunityScore > 20 && (
          <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
            <h4 className="font-semibold text-purple-400 mb-2">Suggested Actions</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {impactMetrics.criticalWaitLinks > 0 && (
                <li>• Priority: Address {impactMetrics.criticalWaitLinks} links with 14+ day waits</li>
              )}
              {impactMetrics.longWaitLinks > 0 && (
                <li>• Investigate {impactMetrics.longWaitLinks} links with 7+ day waits</li>
              )}
              {impactMetrics.errorLinks > 0 && (
                <li>• Resolve {impactMetrics.errorLinks} link errors affecting ~{impactMetrics.patientsAffectedByErrors} patients/week</li>
              )}
              {impactMetrics.avgDaysOut > 5 && (
                <li>• Target reducing average wait from {impactMetrics.avgDaysOut}d to under 5d</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

