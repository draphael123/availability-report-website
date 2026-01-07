import { FilterState, CategoryType } from './types'

/**
 * Serialize filter state to URL search params
 */
export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()
  
  if (filters.globalSearch) {
    params.set('q', filters.globalSearch)
  }
  
  if (filters.categoryType !== 'all') {
    params.set('type', filters.categoryType)
  }
  
  if (filters.category) {
    params.set('category', filters.category)
  }
  
  if (filters.location) {
    params.set('location', filters.location)
  }
  
  if (filters.daysOutMin !== null) {
    params.set('daysMin', String(filters.daysOutMin))
  }
  
  if (filters.daysOutMax !== null) {
    params.set('daysMax', String(filters.daysOutMax))
  }
  
  if (filters.errorsOnly) {
    params.set('errors', 'true')
  }
  
  return params
}

/**
 * Parse URL search params to filter state
 */
export function searchParamsToFilters(params: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {}
  
  const q = params.get('q')
  if (q) filters.globalSearch = q
  
  const type = params.get('type')
  if (type && ['HRT', 'TRT', 'Provider'].includes(type)) {
    filters.categoryType = type as CategoryType
  }
  
  const category = params.get('category')
  if (category) filters.category = category
  
  const location = params.get('location')
  if (location) filters.location = location
  
  const daysMin = params.get('daysMin')
  if (daysMin) filters.daysOutMin = parseInt(daysMin, 10)
  
  const daysMax = params.get('daysMax')
  if (daysMax) filters.daysOutMax = parseInt(daysMax, 10)
  
  const errors = params.get('errors')
  if (errors === 'true') filters.errorsOnly = true
  
  return filters
}

/**
 * Update URL without navigation
 */
export function updateURLWithFilters(filters: FilterState): void {
  if (typeof window === 'undefined') return
  
  const params = filtersToSearchParams(filters)
  const newURL = params.toString() 
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname
  
  window.history.replaceState({}, '', newURL)
}

/**
 * Get initial filters from URL
 */
export function getFiltersFromURL(): Partial<FilterState> {
  if (typeof window === 'undefined') return {}
  
  const params = new URLSearchParams(window.location.search)
  return searchParamsToFilters(params)
}

/**
 * Filter presets
 */
export interface FilterPreset {
  id: string
  name: string
  filters: Partial<FilterState>
  icon?: string
}

export const defaultPresets: FilterPreset[] = [
  {
    id: 'errors',
    name: 'Show Errors Only',
    filters: { errorsOnly: true },
    icon: '⚠️',
  },
  {
    id: 'hrt',
    name: 'HRT Links',
    filters: { categoryType: 'HRT' },
    icon: '💊',
  },
  {
    id: 'trt',
    name: 'TRT Links',
    filters: { categoryType: 'TRT' },
    icon: '💪',
  },
  {
    id: 'providers',
    name: 'Providers',
    filters: { categoryType: 'Provider' },
    icon: '👨‍⚕️',
  },
  {
    id: 'urgent',
    name: 'High Days Out (30+)',
    filters: { daysOutMin: 30 },
    icon: '🔴',
  },
  {
    id: 'good',
    name: 'Low Days Out (<7)',
    filters: { daysOutMax: 7 },
    icon: '🟢',
  },
]

/**
 * Get saved custom presets from localStorage
 */
export function getSavedPresets(): FilterPreset[] {
  if (typeof window === 'undefined') return []
  
  try {
    const saved = localStorage.getItem('filterPresets')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

/**
 * Save custom preset to localStorage
 */
export function savePreset(preset: FilterPreset): void {
  if (typeof window === 'undefined') return
  
  const existing = getSavedPresets()
  const updated = [...existing.filter(p => p.id !== preset.id), preset]
  localStorage.setItem('filterPresets', JSON.stringify(updated))
}

/**
 * Delete custom preset from localStorage
 */
export function deletePreset(presetId: string): void {
  if (typeof window === 'undefined') return
  
  const existing = getSavedPresets()
  const updated = existing.filter(p => p.id !== presetId)
  localStorage.setItem('filterPresets', JSON.stringify(updated))
}



