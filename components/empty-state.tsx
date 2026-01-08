'use client'

import { Search, Filter, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  type: 'no-data' | 'no-results' | 'error'
  title?: string
  message?: string
  onAction?: () => void
  actionLabel?: string
}

export function EmptyState({ type, title, message, onAction, actionLabel }: EmptyStateProps) {
  const configs = {
    'no-data': {
      icon: AlertCircle,
      defaultTitle: 'No Data Available',
      defaultMessage: 'There is no data to display at the moment.',
      iconColor: 'text-muted-foreground',
    },
    'no-results': {
      icon: Search,
      defaultTitle: 'No Results Found',
      defaultMessage: 'Try adjusting your filters or search terms.',
      iconColor: 'text-muted-foreground',
    },
    'error': {
      icon: AlertCircle,
      defaultTitle: 'Something Went Wrong',
      defaultMessage: 'We encountered an error loading the data.',
      iconColor: 'text-destructive',
    },
  }

  const config = configs[type]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Decorative background */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl scale-150" />
        <div className="relative bg-muted/50 rounded-full p-6 mb-6">
          <Icon className={`h-12 w-12 ${config.iconColor}`} />
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {title || config.defaultTitle}
      </h3>
      
      <p className="text-muted-foreground max-w-sm mb-6">
        {message || config.defaultMessage}
      </p>

      {onAction && (
        <Button onClick={onAction} className="gap-2">
          {type === 'error' ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Filter className="h-4 w-4" />
          )}
          {actionLabel || (type === 'error' ? 'Try Again' : 'Clear Filters')}
        </Button>
      )}

      {/* Decorative dots */}
      <div className="flex gap-1 mt-8">
        <div className="w-2 h-2 rounded-full bg-primary/20" />
        <div className="w-2 h-2 rounded-full bg-primary/40" />
        <div className="w-2 h-2 rounded-full bg-primary/60" />
      </div>
    </div>
  )
}




