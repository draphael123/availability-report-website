'use client'

import { Search, Filter, X, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilterState, CategoryType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  categories: string[]
  locations: string[]
}

const categoryTypeOptions: { value: CategoryType; label: string; color: string }[] = [
  { value: 'all', label: 'All Types', color: 'bg-gray-100 text-gray-700' },
  { value: 'HRT', label: 'HRT', color: 'badge-hrt' },
  { value: 'TRT', label: 'TRT', color: 'badge-trt' },
  { value: 'Provider', label: 'Provider', color: 'badge-provider' },
]

export function Filters({
  filters,
  onFiltersChange,
  categories,
  locations,
}: FiltersProps) {
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    const newFilters = { ...filters, [key]: value }
    onFiltersChange(newFilters)
  }

  const clearSearch = () => {
    onFiltersChange({ ...filters, globalSearch: '' })
  }

  const clearFilters = () => {
    onFiltersChange({
      globalSearch: '',
      categoryType: 'all',
      category: null,
      location: null,
      daysOutMin: null,
      daysOutMax: null,
      errorsOnly: false,
    })
  }

  const hasActiveFilters =
    filters.globalSearch ||
    filters.categoryType !== 'all' ||
    filters.category ||
    filters.location ||
    filters.daysOutMin !== null ||
    filters.daysOutMax !== null ||
    filters.errorsOnly

  const hasSearchText = filters.globalSearch && filters.globalSearch.trim() !== ''

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
      {/* Top row - Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
            hasSearchText ? "text-primary" : "text-muted-foreground"
          )} />
          <Input
            type="text"
            placeholder="Search all columns..."
            value={filters.globalSearch}
            onChange={(e) => updateFilter('globalSearch', e.target.value)}
            className={cn(
              "pl-10 pr-10 bg-background transition-all",
              hasSearchText && "ring-2 ring-primary/20 border-primary"
            )}
          />
          {hasSearchText && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all filters
          </Button>
        )}
      </div>

      {/* Category Type buttons */}
      <div className="flex flex-wrap gap-2">
        {categoryTypeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => updateFilter('categoryType', option.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              filters.categoryType === option.value
                ? 'ring-2 ring-primary ring-offset-2 shadow-md scale-105'
                : 'hover:scale-102 opacity-70 hover:opacity-100',
              option.color
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Category filter */}
        <div className="space-y-1.5 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select
            value={filters.category || 'all'}
            onValueChange={(v) => updateFilter('category', v === 'all' ? null : v)}
          >
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location filter */}
        <div className="space-y-1.5 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Location</Label>
          <Select
            value={filters.location || 'all'}
            onValueChange={(v) => updateFilter('location', v === 'all' ? null : v)}
          >
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Days Out range */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Days Out</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.daysOutMin ?? ''}
              onChange={(e) =>
                updateFilter(
                  'daysOutMin',
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-20 h-9 bg-background"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.daysOutMax ?? ''}
              onChange={(e) =>
                updateFilter(
                  'daysOutMax',
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-20 h-9 bg-background"
            />
          </div>
        </div>

        {/* Errors only toggle */}
        <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-background">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <Label htmlFor="errors-only" className="text-sm cursor-pointer">
            Errors only
          </Label>
          <Switch
            id="errors-only"
            checked={filters.errorsOnly}
            onCheckedChange={(checked) => updateFilter('errorsOnly', checked)}
          />
        </div>

        {/* Active filter indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters active</span>
          </div>
        )}
      </div>
    </div>
  )
}
