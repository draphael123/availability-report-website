/**
 * User preferences management - stored in localStorage
 */

export interface SLATargets {
  excellent: number  // e.g., < 2 days
  good: number       // e.g., < 4 days
  acceptable: number // e.g., < 7 days
  // anything above acceptable is "needs attention"
}

export interface UserPreferences {
  favorites: string[]  // Array of link names
  slaTargets: SLATargets
  dashboardLayout: string[]  // Order of dashboard sections
  hiddenSections: string[]   // Sections user has hidden
  annotations: Record<string, string>  // linkName -> note
}

const DEFAULT_SLA_TARGETS: SLATargets = {
  excellent: 2,
  good: 4,
  acceptable: 7,
}

const DEFAULT_PREFERENCES: UserPreferences = {
  favorites: [],
  slaTargets: DEFAULT_SLA_TARGETS,
  dashboardLayout: ['daily-summary', 'health-score', 'charts', 'table'],
  hiddenSections: [],
  annotations: {},
}

const STORAGE_KEY = 'oncehub-preferences'

export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_PREFERENCES, ...parsed }
    }
  } catch (e) {
    console.error('Failed to load preferences:', e)
  }
  
  return DEFAULT_PREFERENCES
}

export function savePreferences(prefs: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return
  
  try {
    const current = getPreferences()
    const updated = { ...current, ...prefs }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to save preferences:', e)
  }
}

// Favorites management
export function toggleFavorite(linkName: string): string[] {
  const prefs = getPreferences()
  const favorites = prefs.favorites.includes(linkName)
    ? prefs.favorites.filter(f => f !== linkName)
    : [...prefs.favorites, linkName]
  
  savePreferences({ favorites })
  return favorites
}

export function isFavorite(linkName: string): boolean {
  return getPreferences().favorites.includes(linkName)
}

export function getFavorites(): string[] {
  return getPreferences().favorites
}

// SLA management
export function getSLATargets(): SLATargets {
  return getPreferences().slaTargets
}

export function setSLATargets(targets: SLATargets): void {
  savePreferences({ slaTargets: targets })
}

// Annotations
export function getAnnotation(linkName: string): string | undefined {
  return getPreferences().annotations[linkName]
}

export function setAnnotation(linkName: string, note: string): void {
  const prefs = getPreferences()
  const annotations = { ...prefs.annotations, [linkName]: note }
  if (!note) delete annotations[linkName]
  savePreferences({ annotations })
}

export function getAllAnnotations(): Record<string, string> {
  return getPreferences().annotations
}

// Health Score calculation
export function calculateHealthScore(
  daysOut: number | null,
  hasError: boolean,
  slaTargets: SLATargets = DEFAULT_SLA_TARGETS
): { score: number; grade: string; color: string } {
  if (hasError) {
    return { score: 0, grade: 'Error', color: 'text-red-500' }
  }
  
  if (daysOut === null) {
    return { score: 0, grade: 'N/A', color: 'text-gray-500' }
  }
  
  // Score from 0-100 based on SLA targets
  let score: number
  let grade: string
  let color: string
  
  if (daysOut <= slaTargets.excellent) {
    score = 100
    grade = 'A+'
    color = 'text-emerald-500'
  } else if (daysOut <= slaTargets.good) {
    score = 85 - ((daysOut - slaTargets.excellent) / (slaTargets.good - slaTargets.excellent)) * 15
    grade = 'A'
    color = 'text-emerald-400'
  } else if (daysOut <= slaTargets.acceptable) {
    score = 70 - ((daysOut - slaTargets.good) / (slaTargets.acceptable - slaTargets.good)) * 20
    grade = 'B'
    color = 'text-blue-500'
  } else if (daysOut <= slaTargets.acceptable * 2) {
    score = 50 - ((daysOut - slaTargets.acceptable) / slaTargets.acceptable) * 20
    grade = 'C'
    color = 'text-amber-500'
  } else {
    score = Math.max(0, 30 - (daysOut - slaTargets.acceptable * 2) * 2)
    grade = daysOut > slaTargets.acceptable * 3 ? 'F' : 'D'
    color = 'text-red-500'
  }
  
  return { score: Math.round(score), grade, color }
}

// SLA Status
export function getSLAStatus(
  daysOut: number | null,
  slaTargets: SLATargets = DEFAULT_SLA_TARGETS
): { status: 'excellent' | 'good' | 'acceptable' | 'needs-attention' | 'unknown'; color: string } {
  if (daysOut === null) {
    return { status: 'unknown', color: 'bg-gray-500' }
  }
  
  if (daysOut <= slaTargets.excellent) {
    return { status: 'excellent', color: 'bg-emerald-500' }
  }
  if (daysOut <= slaTargets.good) {
    return { status: 'good', color: 'bg-blue-500' }
  }
  if (daysOut <= slaTargets.acceptable) {
    return { status: 'acceptable', color: 'bg-amber-500' }
  }
  return { status: 'needs-attention', color: 'bg-red-500' }
}

