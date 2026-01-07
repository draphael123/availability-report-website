'use client'

import { Activity, Calendar, Clock, Sparkles, TrendingUp, Users, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { SummaryStats } from '@/lib/types'

interface HeroSectionProps {
  stats: SummaryStats | null
  lastRefreshed: string | null
}

export function HeroSection({ stats, lastRefreshed }: HeroSectionProps) {
  return (
    <div className="hero-gradient rounded-2xl p-6 md:p-8 mb-6 border border-purple-200/50 dark:border-purple-800/50 relative z-10">
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <Sparkles className="h-24 w-24 text-purple-500" />
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            <span className="text-gradient-primary">Oncehub Availability</span>
            <span className="text-gradient-cool ml-2">Report</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Real-time monitoring dashboard for tracking appointment availability across 
            <span className="font-semibold text-pink-600 dark:text-pink-400"> HRT</span>, 
            <span className="font-semibold text-blue-600 dark:text-blue-400"> TRT</span>, and 
            <span className="font-semibold text-purple-600 dark:text-purple-400"> Provider</span> services.
          </p>
        </div>
        
        {lastRefreshed && (
          <div className="flex items-center gap-2 text-sm glass px-4 py-2 rounded-full shadow-lg">
            <span className="relative flex h-3 w-3">
              <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 indicator-success"></span>
            </span>
            <span className="text-muted-foreground">Live:</span>
            <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {lastRefreshed}
            </span>
          </div>
        )}
      </div>

      {/* Purpose Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
        <Card className="p-4 glass card-hover border-purple-300/50 dark:border-purple-700/50 group">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gradient-primary">Track Availability</h3>
              <p className="text-sm text-muted-foreground">Monitor days out and first available appointments in real-time</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 glass card-hover border-blue-300/50 dark:border-blue-700/50 group">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Analyze Trends</h3>
              <p className="text-sm text-muted-foreground">View weekly trends and category breakdowns with interactive charts</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 glass card-hover border-orange-300/50 dark:border-orange-700/50 group">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">Identify Issues</h3>
              <p className="text-sm text-muted-foreground">Quickly spot errors and anomalies across all providers</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 relative z-10">
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            label="Total Rows"
            value={stats.totalRows.toLocaleString()}
            gradient="from-purple-500 to-pink-500"
            shadowColor="purple"
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Categories"
            value={stats.totalCategories.toString()}
            gradient="from-blue-500 to-cyan-500"
            shadowColor="blue"
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Avg Days Out"
            value={stats.avgDaysOut?.toFixed(1) || 'N/A'}
            gradient="from-emerald-500 to-teal-500"
            shadowColor="emerald"
          />
          <StatCard
            label="Error Rate"
            value={`${stats.errorRate}%`}
            gradient={stats.errorRate > 10 ? "from-red-500 to-orange-500" : "from-emerald-500 to-green-500"}
            shadowColor={stats.errorRate > 10 ? "red" : "emerald"}
          />
          <StatCard
            label="HRT"
            value={stats.hrtCount.toLocaleString()}
            gradient="from-pink-500 to-rose-500"
            shadowColor="pink"
          />
          <StatCard
            label="TRT"
            value={stats.trtCount.toLocaleString()}
            gradient="from-blue-500 to-indigo-500"
            shadowColor="blue"
          />
          <StatCard
            label="Provider"
            value={stats.providerCount.toLocaleString()}
            gradient="from-violet-500 to-purple-500"
            shadowColor="violet"
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
  gradient,
  shadowColor
}: { 
  icon?: React.ReactNode
  label: string
  value: string
  gradient: string
  shadowColor: string
}) {
  const shadowClasses: Record<string, string> = {
    purple: 'shadow-purple-500/20 hover:shadow-purple-500/40',
    blue: 'shadow-blue-500/20 hover:shadow-blue-500/40',
    emerald: 'shadow-emerald-500/20 hover:shadow-emerald-500/40',
    red: 'shadow-red-500/20 hover:shadow-red-500/40',
    pink: 'shadow-pink-500/20 hover:shadow-pink-500/40',
    violet: 'shadow-violet-500/20 hover:shadow-violet-500/40',
    orange: 'shadow-orange-500/20 hover:shadow-orange-500/40',
  }

  return (
    <div className={`rounded-xl glass p-3 transition-all duration-300 hover:-translate-y-1 shadow-lg ${shadowClasses[shadowColor] || ''}`}>
      <div className={`flex items-center gap-1.5 text-xs mb-1 bg-gradient-to-r ${gradient} bg-clip-text text-transparent font-medium`}>
        {icon && <span className={`bg-gradient-to-r ${gradient} bg-clip-text`}>{icon}</span>}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent animate-count`}>
        {value}
      </div>
    </div>
  )
}
