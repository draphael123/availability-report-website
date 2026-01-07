'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Activity, Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { SheetDataResponse, ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

type WidgetType = 'status' | 'stats' | 'best' | 'worst' | 'mini'

export default function EmbedPage() {
  const searchParams = useSearchParams()
  const widgetType = (searchParams.get('type') || 'status') as WidgetType
  const theme = searchParams.get('theme') || 'dark'
  const category = searchParams.get('category') || 'all'
  
  const [data, setData] = useState<SheetDataResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sheet')
        const result = await res.json()
        if (result.success) {
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const filteredData = useMemo(() => {
    if (!data?.data) return []
    if (category === 'all') return data.data
    return data.data.filter(r => r.categoryType === category)
  }, [data, category])

  const stats = useMemo(() => {
    const withDaysOut = filteredData.filter(r => r.daysOut !== null)
    const avgDaysOut = withDaysOut.length > 0
      ? withDaysOut.reduce((s, r) => s + r.daysOut!, 0) / withDaysOut.length
      : null
    const errorCount = filteredData.filter(r => r.hasError).length
    const excellent = withDaysOut.filter(r => r.daysOut! <= 2).length
    const sorted = [...withDaysOut].sort((a, b) => a.daysOut! - b.daysOut!)
    
    return {
      total: filteredData.length,
      avgDaysOut,
      errorCount,
      excellent,
      best: sorted.slice(0, 5),
      worst: sorted.slice(-5).reverse(),
    }
  }, [filteredData])

  const bgClass = theme === 'light' 
    ? 'bg-white text-gray-900' 
    : 'bg-gray-900 text-white'

  if (loading) {
    return (
      <div className={cn("p-4 flex items-center justify-center min-h-[100px]", bgClass)}>
        <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // Mini widget - just a status badge
  if (widgetType === 'mini') {
    const status = stats.errorCount > 0 ? 'error' : 
                   stats.avgDaysOut && stats.avgDaysOut < 4 ? 'good' : 'warning'
    
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", bgClass)}>
        <span className={cn(
          "w-2 h-2 rounded-full",
          status === 'good' && "bg-emerald-500",
          status === 'warning' && "bg-amber-500",
          status === 'error' && "bg-red-500"
        )} />
        <span>
          {stats.avgDaysOut?.toFixed(1) || '--'}d avg
        </span>
      </div>
    )
  }

  // Status widget - overall status
  if (widgetType === 'status') {
    return (
      <div className={cn("p-4 rounded-lg", bgClass)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Oncehub Status</h3>
          <Activity className={cn(
            "h-4 w-4",
            stats.errorCount === 0 ? "text-emerald-500" : "text-amber-500"
          )} />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-500">{stats.total}</div>
            <div className="text-xs text-gray-500">Links</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">
              {stats.avgDaysOut?.toFixed(1) || '--'}
            </div>
            <div className="text-xs text-gray-500">Avg Days</div>
          </div>
          <div>
            <div className={cn(
              "text-2xl font-bold",
              stats.errorCount > 0 ? "text-red-500" : "text-emerald-500"
            )}>
              {stats.errorCount}
            </div>
            <div className="text-xs text-gray-500">Errors</div>
          </div>
        </div>
      </div>
    )
  }

  // Stats widget - detailed stats
  if (widgetType === 'stats') {
    return (
      <div className={cn("p-4 rounded-lg", bgClass)}>
        <h3 className="font-semibold text-sm mb-3">Availability Stats</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Total Links</span>
            <span className="font-medium">{stats.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Average Wait</span>
            <span className="font-medium">{stats.avgDaysOut?.toFixed(1) || '--'} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Excellent (&lt;2d)</span>
            <span className="font-medium text-emerald-500">{stats.excellent}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Errors</span>
            <span className={cn("font-medium", stats.errorCount > 0 ? "text-red-500" : "text-emerald-500")}>
              {stats.errorCount}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Best performers widget
  if (widgetType === 'best') {
    return (
      <div className={cn("p-4 rounded-lg", bgClass)}>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-emerald-500" />
          Best Availability
        </h3>
        <div className="space-y-2">
          {stats.best.map((row, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="truncate max-w-[150px]" title={row.raw['Name']}>
                {row.raw['Name'] || 'Unknown'}
              </span>
              <span className="font-medium text-emerald-500">{row.daysOut}d</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Worst performers widget
  if (widgetType === 'worst') {
    return (
      <div className={cn("p-4 rounded-lg", bgClass)}>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-red-500" />
          Needs Attention
        </h3>
        <div className="space-y-2">
          {stats.worst.map((row, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="truncate max-w-[150px]" title={row.raw['Name']}>
                {row.raw['Name'] || 'Unknown'}
              </span>
              <span className="font-medium text-red-500">{row.daysOut}d</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

