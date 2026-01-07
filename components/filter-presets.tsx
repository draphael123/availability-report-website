'use client'

import { useState } from 'react'
import { Bookmark, Plus, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { FilterState } from '@/lib/types'
import { FilterPreset, defaultPresets, getSavedPresets, savePreset, deletePreset } from '@/lib/url-state'
import { cn } from '@/lib/utils'

interface FilterPresetsProps {
  currentFilters: FilterState
  onApplyPreset: (filters: Partial<FilterState>) => void
}

export function FilterPresets({ currentFilters, onApplyPreset }: FilterPresetsProps) {
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>(() => getSavedPresets())
  const [isCreating, setIsCreating] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')

  const allPresets = [...defaultPresets, ...customPresets]

  const handleSaveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return

    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      filters: { ...currentFilters },
      icon: '⭐',
    }

    savePreset(newPreset)
    setCustomPresets(getSavedPresets())
    setNewPresetName('')
    setIsCreating(false)
  }

  const handleDeletePreset = (presetId: string) => {
    deletePreset(presetId)
    setCustomPresets(getSavedPresets())
  }

  const hasActiveFilters = 
    currentFilters.globalSearch ||
    currentFilters.categoryType !== 'all' ||
    currentFilters.category ||
    currentFilters.location ||
    currentFilters.daysOutMin !== null ||
    currentFilters.daysOutMax !== null ||
    currentFilters.errorsOnly

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="h-4 w-4" />
          Presets
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Quick Filters</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {allPresets.map(preset => (
          <DropdownMenuItem
            key={preset.id}
            className="gap-2 cursor-pointer justify-between"
            onClick={() => onApplyPreset(preset.filters)}
          >
            <div className="flex items-center gap-2">
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </div>
            {preset.id.startsWith('custom-') && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeletePreset(preset.id)
                }}
                className="opacity-50 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {isCreating ? (
          <div className="p-2">
            <div className="flex gap-2">
              <Input
                placeholder="Preset name..."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCurrentAsPreset()
                  if (e.key === 'Escape') setIsCreating(false)
                }}
              />
              <Button size="sm" className="h-8 px-2" onClick={handleSaveCurrentAsPreset}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saves current filter settings
            </p>
          </div>
        ) : (
          <DropdownMenuItem
            className={cn(
              "gap-2 cursor-pointer",
              !hasActiveFilters && "opacity-50 pointer-events-none"
            )}
            onClick={() => setIsCreating(true)}
            disabled={!hasActiveFilters}
          >
            <Plus className="h-4 w-4" />
            <span>Save Current Filters</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

