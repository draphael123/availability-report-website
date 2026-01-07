'use client'

import { Activity, Calendar, Clock, TrendingUp, Users, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { SummaryStats } from '@/lib/types'

interface HeroSectionProps {
  stats: SummaryStats | null
  lastRefreshed: string | null
}

export function HeroSection({ stats, lastRefreshed }: HeroSectionProps) {
  return (
    <div className="hero-gradient rounded-2xl p-6 md:p-8 mb-6 border">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            Oncehub Availability Report
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Real-time monitoring dashboard for tracking appointment availability across HRT, TRT, and Provider services. 
            Data is automatically synced from Google Sheets to provide up-to-date insights.
          </p>
        </div>
        
        {lastRefreshed && (
          <div className="flex items-center gap-2 text-sm bg-card/80 backdrop-blur px-4 py-2 rounded-full border shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-muted-foreground">Last updated:</span>
            <span className="font-medium">{lastRefreshed}</span>
          </div>
        )}
      </div>

      {/* Purpose Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-card/80 backdrop-blur border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-600 dark:text-purple-400">Track Availability</h3>
              <p className="text-sm text-muted-foreground">Monitor days out and first available appointments in real-time</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card/80 backdrop-blur border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-600 dark:text-blue-400">Analyze Trends</h3>
              <p className="text-sm text-muted-foreground">View weekly trends and category breakdowns with interactive charts</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card/80 backdrop-blur border-pink-200 dark:border-pink-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
              <Zap className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h3 className="font-semibold text-pink-600 dark:text-pink-400">Identify Issues</h3>
              <p className="text-sm text-muted-foreground">Quickly spot errors and anomalies across all providers</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            label="Total Rows"
            value={stats.totalRows.toLocaleString()}
            color="purple"
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Categories"
            value={stats.totalCategories.toString()}
            color="blue"
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Avg Days Out"
            value={stats.avgDaysOut?.toFixed(1) || 'N/A'}
            color="green"
          />
          <StatCard
            label="Error Rate"
            value={`${stats.errorRate}%`}
            color={stats.errorRate > 10 ? 'red' : 'green'}
          />
          <StatCard
            label="HRT"
            value={stats.hrtCount.toLocaleString()}
            color="pink"
          />
          <StatCard
            label="TRT"
            value={stats.trtCount.toLocaleString()}
            color="cyan"
          />
          <StatCard
            label="Provider"
            value={stats.providerCount.toLocaleString()}
            color="violet"
          />
        </div>
      )}
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon?: React.ReactNode
  label: string
  value: string
  color: 'purple' | 'blue' | 'green' | 'pink' | 'cyan' | 'violet' | 'red'
}) {
  const colorClasses = {
    purple: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 text-green-600 dark:text-green-400',
    pink: 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800 text-pink-600 dark:text-pink-400',
    cyan: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400',
    violet: 'bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800 text-violet-600 dark:text-violet-400',
    red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-600 dark:text-red-400',
  }

  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  )
}

