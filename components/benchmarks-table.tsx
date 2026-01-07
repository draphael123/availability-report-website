'use client'

import { TrendingUp, TrendingDown, Minus, ExternalLink, Trophy, Medal } from 'lucide-react'
import { PerformanceBenchmark } from '@/lib/history'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface BenchmarksTableProps {
  benchmarks: PerformanceBenchmark[]
  showTop?: number
}

const statusConfig = {
  excellent: { label: 'Excellent', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  good: { label: 'Good', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  average: { label: 'Average', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  poor: { label: 'Poor', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export function BenchmarksTable({ benchmarks, showTop = 10 }: BenchmarksTableProps) {
  const displayBenchmarks = benchmarks.slice(0, showTop)

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Rank</th>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-right p-3 font-medium">Days Out</th>
              <th className="text-right p-3 font-medium">vs Avg</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-center p-3 font-medium">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayBenchmarks.map((benchmark) => {
              const status = statusConfig[benchmark.status]
              
              return (
                <tr key={benchmark.name} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {benchmark.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      {benchmark.rank === 2 && <Medal className="h-4 w-4 text-gray-400" />}
                      {benchmark.rank === 3 && <Medal className="h-4 w-4 text-amber-600" />}
                      <span className={cn(
                        'font-mono',
                        benchmark.rank <= 3 && 'font-bold'
                      )}>
                        #{benchmark.rank}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-medium truncate max-w-[200px] block" title={benchmark.name}>
                      {benchmark.name}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-mono font-medium">
                      {benchmark.daysOut !== null ? benchmark.daysOut : '-'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {benchmark.vsAverage !== null ? (
                      <div className={cn(
                        'flex items-center justify-end gap-1',
                        benchmark.vsAverage < 0 ? 'text-green-600 dark:text-green-400' : 
                        benchmark.vsAverage > 0 ? 'text-red-600 dark:text-red-400' : 
                        'text-muted-foreground'
                      )}>
                        {benchmark.vsAverage < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : benchmark.vsAverage > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        <span className="font-mono text-xs">
                          {benchmark.vsAverage > 0 ? '+' : ''}{benchmark.vsAverage.toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="secondary" className={cn('text-xs', status.color)}>
                      {status.label}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    {benchmark.url ? (
                      <a
                        href={benchmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 inline" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {benchmarks.length > showTop && (
        <div className="border-t p-3 text-center text-sm text-muted-foreground bg-muted/30">
          Showing top {showTop} of {benchmarks.length} links
        </div>
      )}
    </div>
  )
}



