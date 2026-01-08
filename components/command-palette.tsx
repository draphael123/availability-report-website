'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  Search,
  Home,
  BarChart3,
  Zap,
  RefreshCw,
  Download,
  Moon,
  Sun,
  Filter,
  Star,
  Settings,
  X,
  ArrowRight,
  ExternalLink,
  Code,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  data?: ParsedSheetRow[]
  onRefresh?: () => void
  onExport?: () => void
  onToggleTheme?: () => void
  onSelectLink?: (row: ParsedSheetRow) => void
  onApplyFilter?: (filter: { type: string; value: string }) => void
}

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  category: 'navigation' | 'action' | 'filter' | 'link'
  keywords?: string[]
  action: () => void
  shortcut?: string
}

export function CommandPalette({
  isOpen,
  onClose,
  data = [],
  onRefresh,
  onExport,
  onToggleTheme,
  onSelectLink,
  onApplyFilter,
}: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Build command items
  const commands = useMemo((): CommandItem[] => {
    const items: CommandItem[] = [
      // Navigation
      {
        id: 'nav-home',
        label: 'Go to Dashboard',
        description: 'Main dashboard view',
        icon: <Home className="h-4 w-4" />,
        category: 'navigation',
        keywords: ['home', 'main', 'dashboard'],
        action: () => { router.push('/'); onClose(); },
        shortcut: 'G H',
      },
      {
        id: 'nav-analytics',
        label: 'Go to Analytics',
        description: 'Detailed link analytics',
        icon: <BarChart3 className="h-4 w-4" />,
        category: 'navigation',
        keywords: ['analytics', 'charts', 'graphs'],
        action: () => { router.push('/analytics'); onClose(); },
        shortcut: 'G A',
      },
      {
        id: 'nav-insights',
        label: 'Go to Insights',
        description: 'Advanced insights and forecasts',
        icon: <Zap className="h-4 w-4" />,
        category: 'navigation',
        keywords: ['insights', 'predictions', 'sla'],
        action: () => { router.push('/insights'); onClose(); },
        shortcut: 'G I',
      },
      {
        id: 'nav-embed',
        label: 'Go to Embed Docs',
        description: 'Widget embed documentation',
        icon: <Code className="h-4 w-4" />,
        category: 'navigation',
        keywords: ['embed', 'widget', 'iframe'],
        action: () => { router.push('/embed/docs'); onClose(); },
      },

      // Actions
      {
        id: 'action-refresh',
        label: 'Refresh Data',
        description: 'Fetch latest data from Google Sheets',
        icon: <RefreshCw className="h-4 w-4" />,
        category: 'action',
        keywords: ['refresh', 'reload', 'update'],
        action: () => { onRefresh?.(); onClose(); },
        shortcut: '⌘⇧R',
      },
      {
        id: 'action-export',
        label: 'Export Data',
        description: 'Download data as CSV',
        icon: <Download className="h-4 w-4" />,
        category: 'action',
        keywords: ['export', 'download', 'csv'],
        action: () => { onExport?.(); onClose(); },
        shortcut: '⌘E',
      },
      {
        id: 'action-theme',
        label: 'Toggle Dark Mode',
        description: 'Switch between light and dark themes',
        icon: <Moon className="h-4 w-4" />,
        category: 'action',
        keywords: ['theme', 'dark', 'light', 'mode'],
        action: () => { onToggleTheme?.(); onClose(); },
        shortcut: '⌘D',
      },

      // Filters
      {
        id: 'filter-hrt',
        label: 'Filter: HRT Only',
        description: 'Show only HRT links',
        icon: <Filter className="h-4 w-4 text-pink-500" />,
        category: 'filter',
        keywords: ['filter', 'hrt', 'hormone'],
        action: () => { onApplyFilter?.({ type: 'categoryType', value: 'HRT' }); onClose(); },
      },
      {
        id: 'filter-trt',
        label: 'Filter: TRT Only',
        description: 'Show only TRT links',
        icon: <Filter className="h-4 w-4 text-blue-500" />,
        category: 'filter',
        keywords: ['filter', 'trt', 'testosterone'],
        action: () => { onApplyFilter?.({ type: 'categoryType', value: 'TRT' }); onClose(); },
      },
      {
        id: 'filter-provider',
        label: 'Filter: Providers Only',
        description: 'Show only Provider links',
        icon: <Filter className="h-4 w-4 text-purple-500" />,
        category: 'filter',
        keywords: ['filter', 'provider'],
        action: () => { onApplyFilter?.({ type: 'categoryType', value: 'Provider' }); onClose(); },
      },
      {
        id: 'filter-errors',
        label: 'Filter: Errors Only',
        description: 'Show only links with errors',
        icon: <Filter className="h-4 w-4 text-red-500" />,
        category: 'filter',
        keywords: ['filter', 'error', 'problem'],
        action: () => { onApplyFilter?.({ type: 'errorsOnly', value: 'true' }); onClose(); },
      },
      {
        id: 'filter-clear',
        label: 'Clear All Filters',
        description: 'Reset to show all links',
        icon: <X className="h-4 w-4" />,
        category: 'filter',
        keywords: ['clear', 'reset', 'all'],
        action: () => { onApplyFilter?.({ type: 'clear', value: '' }); onClose(); },
      },
    ]

    // Add link items from data
    const linkItems: CommandItem[] = data.slice(0, 50).map(row => ({
      id: `link-${row.rowIndex}`,
      label: row.raw['Name'] || `Link ${row.rowIndex}`,
      description: `${row.raw['Location'] || 'Unknown'} • ${row.daysOut !== null ? `${row.daysOut}d` : 'N/A'}`,
      icon: <ArrowRight className="h-4 w-4" />,
      category: 'link' as const,
      keywords: [
        row.raw['Name']?.toLowerCase() || '',
        row.raw['Location']?.toLowerCase() || '',
        row.raw['Category']?.toLowerCase() || '',
      ],
      action: () => { onSelectLink?.(row); onClose(); },
    }))

    return [...items, ...linkItems]
  }, [data, router, onClose, onRefresh, onExport, onToggleTheme, onSelectLink, onApplyFilter])

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) {
      // Show navigation and actions first when no search
      return commands.filter(c => c.category !== 'link').slice(0, 10)
    }

    const query = search.toLowerCase().trim()
    return commands.filter(cmd => {
      const labelMatch = cmd.label.toLowerCase().includes(query)
      const descMatch = cmd.description?.toLowerCase().includes(query)
      const keywordMatch = cmd.keywords?.some(k => k.includes(query))
      return labelMatch || descMatch || keywordMatch
    }).slice(0, 15)
  }, [commands, search])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [filteredCommands, selectedIndex, onClose])

  // Reset search when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [filteredCommands])

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    action: 'Actions',
    filter: 'Filters',
    link: 'Links',
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, links, or type a filter..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found for "{search}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="mb-2">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {categoryLabels[category] || category}
                </div>
                {items.map((cmd, idx) => {
                  const globalIndex = filteredCommands.indexOf(cmd)
                  const isSelected = globalIndex === selectedIndex

                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                      )}
                    >
                      <span className={cn(
                        "shrink-0",
                        cmd.category === 'link' && "text-muted-foreground"
                      )}>
                        {cmd.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5">↵</kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" />K to open
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to manage command palette state
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  }
}

