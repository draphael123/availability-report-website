'use client'

import { useMemo, useEffect, useState } from 'react'
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataFreshnessProps {
  lastRefreshed: string | null
  isLoading: boolean
}

export function DataFreshness({ lastRefreshed, isLoading }: DataFreshnessProps) {
  const [secondsSince, setSecondsSince] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Parse the last refreshed time
  const lastRefreshTime = useMemo(() => {
    if (!lastRefreshed) return null
    try {
      return new Date(lastRefreshed)
    } catch {
      return null
    }
  }, [lastRefreshed])

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      if (lastRefreshTime) {
        const diff = Math.floor((Date.now() - lastRefreshTime.getTime()) / 1000)
        setSecondsSince(diff)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lastRefreshTime])

  const freshnessStatus = useMemo(() => {
    if (isLoading) {
      return {
        label: 'Updating...',
        icon: RefreshCw,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        animate: true,
      }
    }

    if (secondsSince < 15) {
      return {
        label: 'Live',
        icon: Wifi,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        animate: false,
      }
    }

    if (secondsSince < 30) {
      return {
        label: 'Fresh',
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        animate: false,
      }
    }

    if (secondsSince < 60) {
      return {
        label: 'Recent',
        icon: Clock,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        animate: false,
      }
    }

    return {
      label: 'Updating soon',
      icon: AlertCircle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      animate: false,
    }
  }, [secondsSince, isLoading])

  const StatusIcon = freshnessStatus.icon

  const formatAge = (seconds: number) => {
    if (seconds < 10) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    const mins = Math.floor(seconds / 60)
    return `${mins}m ago`
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
      "border backdrop-blur-sm",
      freshnessStatus.bgColor,
      freshnessStatus.borderColor
    )}>
      <StatusIcon className={cn(
        "h-3.5 w-3.5",
        freshnessStatus.color,
        freshnessStatus.animate && "animate-spin"
      )} />
      <span className={freshnessStatus.color}>{freshnessStatus.label}</span>
      {!isLoading && lastRefreshTime && (
        <span className="text-muted-foreground">
          • {formatAge(secondsSince)}
        </span>
      )}
    </div>
  )
}


