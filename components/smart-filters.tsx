'use client'

import { useState, useMemo } from 'react'
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock,
  Star,
  Filter,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ParsedSheetRow, FilterState } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SmartFilter {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  borderColor: string
  filter: (rows: ParsedSheetRow[]) => ParsedSheetRow[]
  count?: number
}

interface SmartFiltersProps {
  data: ParsedSheetRow[]
  onApplyFilter: (filteredData: ParsedSheetRow[], filterName: string) => void
  activeFilter: string | null
}

export function SmartFilters({ data, onApplyFilter, activeFilter }: SmartFiltersProps) {
  const smartFilters = useMemo((): SmartFilter[] => {
    // Calculate averages for comparison
    const withDaysOut = data.filter(r => r.daysOut !== null)
    const avgDaysOut = withDaysOut.length > 0
      ? withDaysOut.reduce((s, r) => s + r.daysOut!, 0) / withDaysOut.length
      : 5

    return [
      {
        id: 'excellent',
        name: 'Excellent Availability',
        description: 'Links with ≤2 days wait time',
        icon: <ThumbsUp className="h-4 w-4" />,
        color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-300 dark:border-emerald-700',
        filter: (rows) => rows.filter(r => r.daysOut !== null && r.daysOut <= 2),
        count: data.filter(r => r.daysOut !== null && r.daysOut <= 2).length,
      },
      {
        id: 'needs-attention',
        name: 'Needs Attention',
        description: 'Links with >7 days wait or errors',
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
        borderColor: 'border-red-300 dark:border-red-700',
        filter: (rows) => rows.filter(r => (r.daysOut !== null && r.daysOut > 7) || r.hasError),
        count: data.filter(r => (r.daysOut !== null && r.daysOut > 7) || r.hasError).length,
      },
      {
        id: 'above-average',
        name: 'Above Average Wait',
        description: `Links above ${avgDaysOut.toFixed(1)}d average`,
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
        borderColor: 'border-amber-300 dark:border-amber-700',
        filter: (rows) => rows.filter(r => r.daysOut !== null && r.daysOut > avgDaysOut),
        count: data.filter(r => r.daysOut !== null && r.daysOut > avgDaysOut).length,
      },
      {
        id: 'below-average',
        name: 'Below Average Wait',
        description: `Links below ${avgDaysOut.toFixed(1)}d average`,
        icon: <TrendingDown className="h-4 w-4" />,
        color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
        borderColor: 'border-sky-300 dark:border-sky-700',
        filter: (rows) => rows.filter(r => r.daysOut !== null && r.daysOut < avgDaysOut),
        count: data.filter(r => r.daysOut !== null && r.daysOut < avgDaysOut).length,
      },
      {
        id: 'errors-only',
        name: 'Errors Only',
        description: 'Links with scraping errors',
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
        borderColor: 'border-rose-300 dark:border-rose-700',
        filter: (rows) => rows.filter(r => r.hasError),
        count: data.filter(r => r.hasError).length,
      },
      {
        id: 'no-data',
        name: 'Missing Data',
        description: 'Links without days out info',
        icon: <HelpCircle className="h-4 w-4" />,
        color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
        borderColor: 'border-gray-300 dark:border-gray-600',
        filter: (rows) => rows.filter(r => r.daysOut === null && !r.hasError),
        count: data.filter(r => r.daysOut === null && !r.hasError).length,
      },
      {
        id: 'quick-book',
        name: 'Same-Day Available',
        description: 'Links with 0-1 day wait',
        icon: <Zap className="h-4 w-4" />,
        color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
        borderColor: 'border-violet-300 dark:border-violet-700',
        filter: (rows) => rows.filter(r => r.daysOut !== null && r.daysOut <= 1),
        count: data.filter(r => r.daysOut !== null && r.daysOut <= 1).length,
      },
      {
        id: 'long-wait',
        name: 'Long Wait (14+ days)',
        description: 'Links with very long wait times',
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
        borderColor: 'border-orange-300 dark:border-orange-700',
        filter: (rows) => rows.filter(r => r.daysOut !== null && r.daysOut >= 14),
        count: data.filter(r => r.daysOut !== null && r.daysOut >= 14).length,
      },
    ]
  }, [data])

  const handleFilterClick = (filter: SmartFilter) => {
    if (activeFilter === filter.id) {
      // Clear filter
      onApplyFilter(data, '')
    } else {
      onApplyFilter(filter.filter(data), filter.id)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Smart Filters</h3>
        {activeFilter && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onApplyFilter(data, '')}
            className="h-6 px-2 text-xs"
          >
            Clear
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {smartFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterClick(filter)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              "border-2",
              filter.color,
              filter.borderColor,
              activeFilter === filter.id && "ring-2 ring-offset-2 ring-primary",
              filter.count === 0 && "opacity-50"
            )}
            disabled={filter.count === 0}
            title={filter.description}
          >
            {filter.icon}
            <span>{filter.name}</span>
            <Badge 
              variant="secondary" 
              className="ml-1 h-5 px-1.5 text-xs bg-white/50 dark:bg-black/20"
            >
              {filter.count}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  )
}

