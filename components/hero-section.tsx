'use client'

import { Activity, Calendar, Clock, AlertTriangle, TrendingDown, Users } from 'lucide-react'
import { SummaryStats } from '@/lib/types'

interface HeroSectionProps {
  stats: SummaryStats | null
  lastRefreshed: string | null
}

export function HeroSection({ stats, lastRefreshed }: HeroSectionProps) {
  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Dashboard
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-foreground">
            Oncehub Availability
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Track appointment wait times across{' '}
            <span className="font-semibold text-rose-600 dark:text-rose-400">HRT</span>,{' '}
            <span className="font-semibold text-sky-600 dark:text-sky-400">TRT</span>, and{' '}
            <span className="font-semibold text-violet-600 dark:text-violet-400">Provider</span>{' '}
            scheduling links.
          </p>
        </div>
        
        {lastRefreshed && (
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dot-pulse" />
            <span className="text-muted-foreground">Updated {lastRefreshed}</span>
          </div>
        )}
      </div>

      {/* About Section - Collapsible style */}
      <details className="mb-6 group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <span className="underline decoration-dashed underline-offset-4">What is this?</span>
          <span className="text-xs">(click to expand)</span>
        </summary>
        <div className="mt-3 p-4 bg-muted/30 rounded-lg border-l-4 border-primary text-sm text-muted-foreground">
          <p className="mb-2">
            This dashboard monitors <strong>Oncehub scheduling links</strong> to track appointment availability. 
            It scrapes scheduling pages regularly to capture:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Days Out</strong> — How far in advance is the first available appointment?</li>
            <li><strong>Errors</strong> — Are any booking links broken or misconfigured?</li>
            <li><strong>Trends</strong> — Is availability improving or getting worse?</li>
          </ul>
        </div>
      </details>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-terracotta p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-[hsl(15,70%,50%)]" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Links
              </span>
            </div>
            <p className="big-number text-foreground">
              {stats.totalRows}
            </p>
          </div>

          <div className="stat-sage p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-[hsl(150,30%,45%)]" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Avg Wait
              </span>
            </div>
            <p className="big-number text-foreground">
              {stats.avgDaysOut?.toFixed(1) ?? '—'}
              <span className="big-number-unit">days</span>
            </p>
          </div>

          <div className="stat-amber p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-[hsl(40,90%,45%)]" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Under 4 Days
              </span>
            </div>
            <p className="big-number text-foreground">
              {stats.hrtCount + stats.trtCount > 0 
                ? Math.round(((stats.hrtCount + stats.trtCount) / stats.totalRows) * 100)
                : '—'}
              <span className="big-number-unit">%</span>
            </p>
          </div>

          <div className={`p-4 rounded-lg ${stats.errorCount > 0 ? 'stat-coral' : 'stat-slate'}`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`h-4 w-4 ${stats.errorCount > 0 ? 'text-[hsl(0,65%,55%)]' : 'text-[hsl(220,20%,50%)]'}`} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Errors
              </span>
            </div>
            <p className="big-number text-foreground">
              {stats.errorCount}
              {stats.errorCount === 0 && (
                <span className="big-number-unit text-emerald-600">✓</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {stats && (
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="badge-hrt px-3 py-1.5 rounded-md text-sm font-medium">
            HRT: {stats.hrtCount}
          </div>
          <div className="badge-trt px-3 py-1.5 rounded-md text-sm font-medium">
            TRT: {stats.trtCount}
          </div>
          <div className="badge-provider px-3 py-1.5 rounded-md text-sm font-medium">
            Provider: {stats.providerCount}
          </div>
        </div>
      )}
    </div>
  )
}
