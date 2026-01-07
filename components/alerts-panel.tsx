'use client'

import { AlertTriangle, AlertCircle, Info, X, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'
import { Alert, AlertSeverity, AlertType } from '@/lib/history'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface AlertsPanelProps {
  alerts: Alert[]
  onDismiss?: (alertId: string) => void
}

const severityConfig: Record<AlertSeverity, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  },
}

const typeIcons: Record<AlertType, typeof TrendingUp> = {
  days_out_spike: TrendingUp,
  new_error: AlertTriangle,
  error_resolved: CheckCircle,
  availability_drop: TrendingDown,
  availability_improvement: TrendingUp,
}

export function AlertsPanel({ alerts, onDismiss }: AlertsPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(true)

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id))
  
  if (visibleAlerts.length === 0) {
    return null
  }

  const handleDismiss = (alertId: string) => {
    setDismissed(prev => {
      const newSet = new Set(prev)
      newSet.add(alertId)
      return newSet
    })
    onDismiss?.(alertId)
  }

  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length
  const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {criticalCount}
              </span>
            )}
          </div>
          <span className="font-semibold">
            Alerts ({visibleAlerts.length})
          </span>
          {criticalCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {warningCount} warnings
            </span>
          )}
        </div>
        <span className="text-muted-foreground text-sm">
          {expanded ? 'Click to collapse' : 'Click to expand'}
        </span>
      </button>

      {/* Alerts List */}
      {expanded && (
        <div className="border-t divide-y max-h-[300px] overflow-y-auto">
          {visibleAlerts.map(alert => {
            const config = severityConfig[alert.severity]
            const Icon = config.icon
            const TypeIcon = typeIcons[alert.type]

            return (
              <div
                key={alert.id}
                className={cn(
                  'p-4 flex items-start gap-3 transition-colors',
                  config.bg
                )}
              >
                <div className={cn('mt-0.5', config.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{alert.title}</span>
                    <TypeIcon className={cn('h-3.5 w-3.5', config.color)} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {alert.message}
                  </p>
                  {alert.linkUrl && (
                    <a
                      href={alert.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      View Link →
                    </a>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-50 hover:opacity-100"
                  onClick={() => handleDismiss(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

