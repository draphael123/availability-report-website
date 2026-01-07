'use client'

import { useEffect } from 'react'

interface KeyboardShortcutsProps {
  onSearch: () => void
  onRefresh: () => void
  onExport: () => void
  onToggleTheme: () => void
}

export function useKeyboardShortcuts({
  onSearch,
  onRefresh,
  onExport,
  onToggleTheme,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        // Allow Escape to blur inputs
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur()
        }
        return
      }

      // Search: / or Ctrl+K or Cmd+K
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
        e.preventDefault()
        onSearch()
      }

      // Refresh: Ctrl+R or Cmd+R (with Shift to prevent browser refresh)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'r') {
        e.preventDefault()
        onRefresh()
      }

      // Export: Ctrl+E or Cmd+E
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        onExport()
      }

      // Toggle theme: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        onToggleTheme()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSearch, onRefresh, onExport, onToggleTheme])
}

export function KeyboardShortcutsHelp() {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <div className="font-medium mb-2">Keyboard Shortcuts</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">/</kbd> Search</span>
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘⇧R</kbd> Refresh</span>
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘E</kbd> Export</span>
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘D</kbd> Dark mode</span>
      </div>
    </div>
  )
}



