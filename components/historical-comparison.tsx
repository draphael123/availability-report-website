'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Calendar, Clock, Database } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ComparisonData {
  hasHistory: boolean
  message?: string
  period: string
  current?: {
    date: string
    summary: {
      totalRows: number
      hrtCount: number
      trtCount: number
      providerCount: number
      errorCount: number
      avgDaysOut: number | null
    }
  }
  previous?: {
    date: string
    summary: {
      totalRows: number
      hrtCount: number
      trtCount: number
      providerCount: number
      errorCount: number
      avgDaysOut: number | null
    }
  }
  changes?: {
    totalRows: number
    totalRowsPercent: number | null
    hrtCount: number
    trtCount: number
    providerCount: number
    errorCount: number
    avgDaysOut: number | null
    errorRate: number | null
  }
  availableDates: number
  oldestDate: string
  newestDate: string
}

export function HistoricalComparison() {
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [snapshotting, setSnapshotting] = useState(false)

  const fetchComparison = async () => {
    try {
      const res = await fetch(`/api/history/compare?period=${period}`)
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch comparison:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComparison()
  }, [period])

  const takeSnapshot = async () => {
    setSnapshotting(true)
    try {
      const res = await fetch('/api/cron/snapshot')
      const result = await res.json()
      if (result.success) {
        // Refresh the comparison data
        await fetchComparison()
      }
    } catch (error) {
      console.error('Failed to take snapshot:', error)
    } finally {
      setSnapshotting(false)
    }
  }

  if (loading) {
    return (
      <Card className="glass">
        <CardContent className="py-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground mt-2">Loading historical data...</p>
        </CardContent>
      </Card>
    )
  }

  const seedHistory = async () => {
    setSnapshotting(true)
    try {
      const res = await fetch('/api/seed-history')
      const result = await res.json()
      if (result.success) {
        // Refresh the comparison data
        await fetchComparison()
      } else {
        console.error('Failed to seed history:', result.error)
      }
    } catch (error) {
      console.error('Failed to seed history:', error)
    } finally {
      setSnapshotting(false)
    }
  }

  if (!data?.hasHistory) {
    return (
      <Card className="border-dashed border-2 border-purple-300 dark:border-purple-700 glass">
        <CardContent className="py-8 text-center">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gradient-primary">No Historical Data Yet</h3>
          <p className="text-muted-foreground mb-4">
            {data?.message || 'Take your first snapshot or seed historical data to start tracking changes.'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={takeSnapshot} disabled={snapshotting} className="gradient-primary text-white shadow-lg shadow-purple-500/30">
              {snapshotting ? 'Working...' : 'Take Snapshot'}
            </Button>
            <Button onClick={seedHistory} disabled={snapshotting} variant="outline" className="border-purple-300 dark:border-purple-700">
              {snapshotting ? 'Generating...' : 'Generate 30 Days History'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            "Generate 30 Days History" creates simulated historical data based on current values
          </p>
        </CardContent>
      </Card>
    )
  }

  const { current, previous, changes } = data

  return (
    <div className="space-y-4">
      {/* Period selector and snapshot button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Compare with:</span>
          <div className="flex gap-1">
            {(['day', 'week', 'month'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === 'day' ? 'Yesterday' : p === 'week' ? 'Last Week' : 'Last Month'}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{data.availableDates} snapshots available</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={takeSnapshot} 
            disabled={snapshotting}
            className="border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
          >
            {snapshotting ? 'Saving...' : 'Snapshot Now'}
          </Button>
        </div>
      </div>

      {/* Comparison cards */}
      {changes && previous ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ComparisonCard
            label="Total Links"
            current={current?.summary.totalRows || 0}
            change={changes.totalRows}
            changePercent={changes.totalRowsPercent}
          />
          <ComparisonCard
            label="Avg Days Out"
            current={current?.summary.avgDaysOut}
            change={changes.avgDaysOut}
            invertColors // Lower is better
          />
          <ComparisonCard
            label="Errors"
            current={current?.summary.errorCount || 0}
            change={changes.errorCount}
            invertColors // Lower is better
          />
          <ComparisonCard
            label="Error Rate"
            current={current ? ((current.summary.errorCount / current.summary.totalRows) * 100).toFixed(1) + '%' : '0%'}
            change={changes.errorRate}
            suffix="%"
            invertColors // Lower is better
          />
        </div>
      ) : (
        <Card className="glass">
          <CardContent className="py-6 text-center text-muted-foreground">
            <div className="h-12 w-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
            <p>Not enough historical data for {period} comparison.</p>
            <p className="text-xs mt-1">Need at least 2 snapshots.</p>
          </CardContent>
        </Card>
      )}

      {/* Date info */}
      {current && previous && (
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>Comparing: {formatDate(current.date)}</span>
          <span>vs {formatDate(previous.date)}</span>
        </div>
      )}
    </div>
  )
}

function ComparisonCard({
  label,
  current,
  change,
  changePercent,
  suffix = '',
  invertColors = false,
}: {
  label: string
  current: number | string | null | undefined
  change: number | null | undefined
  changePercent?: number | null
  suffix?: string
  invertColors?: boolean
}) {
  const hasChange = change !== null && change !== undefined
  const isPositive = hasChange && change > 0
  const isNegative = hasChange && change < 0
  
  // For metrics where lower is better (errors, days out), invert the colors
  const showGreen = invertColors ? isNegative : isPositive
  const showRed = invertColors ? isPositive : isNegative

  return (
    <Card className="card-hover">
      <CardContent className="pt-4 pb-3">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-2xl font-bold">
          {current ?? 'N/A'}{suffix && typeof current === 'number' ? suffix : ''}
        </div>
        {hasChange && (
          <div className={cn(
            'flex items-center gap-1 text-xs mt-1',
            showGreen && 'text-green-600 dark:text-green-400',
            showRed && 'text-red-600 dark:text-red-400',
            !showGreen && !showRed && 'text-muted-foreground'
          )}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            <span>
              {isPositive ? '+' : ''}{change}{suffix}
              {changePercent !== null && changePercent !== undefined && (
                <span className="opacity-70"> ({isPositive ? '+' : ''}{changePercent}%)</span>
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

