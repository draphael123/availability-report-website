'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RefreshCw, BarChart3, Table2, Trophy, Keyboard, GitCompare, FileText, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Filters } from '@/components/filters'
import { DataTable } from '@/components/data-table'
import { RowDrawer } from '@/components/row-drawer'
import { Charts } from '@/components/charts'
import { AdvancedCharts } from '@/components/advanced-charts'
import { ErrorState } from '@/components/error-state'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { HeroSection } from '@/components/hero-section'
import { AlertsPanel } from '@/components/alerts-panel'
import { HistoricalComparison } from '@/components/historical-comparison'
import { ExportMenu } from '@/components/export-menu'
import { FilterPresets } from '@/components/filter-presets'
import { ThemeToggle } from '@/components/theme-toggle'
import { BenchmarksTable } from '@/components/benchmarks-table'
import { LinkPerformanceTracker } from '@/components/link-performance-tracker'
import { DailyReport } from '@/components/daily-report'
import { DataSummaries } from '@/components/data-summaries'
import { EmptyState } from '@/components/empty-state'
import { SuggestionsBox } from '@/components/suggestions-box'
import { HealthScore } from '@/components/health-score'
import { StreakCounter } from '@/components/streak-counter'
import { HeatMapCalendar } from '@/components/heat-map-calendar'
import { AIInsights } from '@/components/ai-insights'
import { Achievements } from '@/components/achievements'
import { Confetti, useConfetti } from '@/components/confetti'
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '@/components/keyboard-shortcuts'
import { FilterState, ParsedSheetRow, SheetDataResponse, SummaryStats } from '@/lib/types'
import { 
  getUniqueColumnValues, 
  calculateCategoryChartData,
  calculateWeeklyTrend,
  calculateSummaryStats 
} from '@/lib/sheet-parser'
import { detectAnomalies, calculateBenchmarks, Alert } from '@/lib/history'
import { updateURLWithFilters, getFiltersFromURL } from '@/lib/url-state'
import { downloadCSV } from '@/lib/export'

const initialFilters: FilterState = {
  globalSearch: '',
  categoryType: 'all',
  category: null,
  location: null,
  daysOutMin: null,
  daysOutMax: null,
  errorsOnly: false,
}

// Auto-refresh interval (10 seconds for near real-time updates)
const AUTO_REFRESH_INTERVAL = 10 * 1000

export default function Dashboard() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { isActive: confettiActive, trigger: triggerConfetti } = useConfetti()
  
  const [data, setData] = useState<SheetDataResponse | null>(null)
  const [previousData, setPreviousData] = useState<ParsedSheetRow[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [troubleshooting, setTroubleshooting] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [selectedRow, setSelectedRow] = useState<ParsedSheetRow | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [previousErrorCount, setPreviousErrorCount] = useState<number | undefined>(undefined)

  // Load filters from URL on mount
  useEffect(() => {
    const urlFilters = getFiltersFromURL()
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }))
    }
  }, [])

  // Update URL when filters change
  useEffect(() => {
    updateURLWithFilters(filters)
  }, [filters])

  const fetchData = useCallback(async (forceRefresh = false, silent = false) => {
    if (!silent) {
      setIsLoading(true)
    }
    setError(null)
    setTroubleshooting([])

    try {
      const url = forceRefresh ? '/api/sheet?refresh=true' : '/api/sheet'
      const res = await fetch(url)
      const result: SheetDataResponse = await res.json()

      if (!result.success) {
        setError(result.error || 'Failed to fetch data')
        setTroubleshooting(result.troubleshooting || [])
        setData(null)
      } else {
        // Convert date strings back to Date objects
        const processedData: SheetDataResponse = {
          ...result,
          data: result.data.map((row) => ({
            ...row,
            scrapedAt: row.scrapedAt ? new Date(row.scrapedAt) : null,
          })),
        }
        
        // Store previous data for comparison
        if (data?.data) {
          setPreviousData(data.data)
          // Track error count for confetti
          const prevErrors = data.data.filter(r => r.hasError).length
          setPreviousErrorCount(prevErrors)
        }
        
        // Detect anomalies
        if (previousData) {
          const newAlerts = detectAnomalies(processedData.data, previousData)
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)) // Keep last 50 alerts
        }
        
        // Check for confetti celebration (errors went to zero)
        const currentErrors = processedData.data.filter(r => r.hasError).length
        if (previousErrorCount !== undefined && previousErrorCount > 0 && currentErrors === 0) {
          triggerConfetti()
        }
        
        setData(processedData)
        setLastRefreshed(formatDateTime(new Date()))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
      setTroubleshooting([
        'Check your internet connection',
        'Verify the server is running',
        'Check the browser console for details',
      ])
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [data?.data, previousData])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true, true) // Silent refresh
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchData])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
      searchInput?.focus()
    },
    onRefresh: () => fetchData(true),
    onExport: () => {
      if (data && filteredData.length > 0) {
        downloadCSV(filteredData, data.headers)
      }
    },
    onToggleTheme: () => {
      const themeButton = document.querySelector('[title*="mode"]') as HTMLButtonElement
      themeButton?.click()
    },
  })

  // Get unique values for filter dropdowns
  const categories = useMemo(() => {
    if (!data?.data) return []
    return getUniqueColumnValues(data.data, 'Category')
  }, [data])

  const locations = useMemo(() => {
    if (!data?.data) return []
    return getUniqueColumnValues(data.data, 'Location')
  }, [data])

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    if (!data?.data) return []

    return data.data.filter((row) => {
      // Global search - search across ALL fields in the row
      if (filters.globalSearch && filters.globalSearch.trim() !== '') {
        const search = filters.globalSearch.toLowerCase().trim()
        
        // Search through every value in the row
        const matchFound = Object.values(row.raw).some((value) => {
          if (!value) return false
          return String(value).toLowerCase().includes(search)
        })
        
        // If no match found in any field, filter out this row
        if (!matchFound) {
          return false
        }
      }

      // Category type filter (HRT, TRT, Provider)
      if (filters.categoryType !== 'all' && row.categoryType !== filters.categoryType) {
        return false
      }

      // Category filter - check multiple possible column names
      if (filters.category) {
        const categoryValue = row.raw['Category'] || row.raw['category'] || ''
        if (categoryValue !== filters.category) {
          return false
        }
      }

      // Location filter - check multiple possible column names
      if (filters.location) {
        const locationValue = row.raw['Location'] || row.raw['location'] || ''
        if (locationValue !== filters.location) {
          return false
        }
      }

      // Days out range
      if (filters.daysOutMin !== null && (row.daysOut === null || row.daysOut < filters.daysOutMin)) {
        return false
      }
      if (filters.daysOutMax !== null && (row.daysOut === null || row.daysOut > filters.daysOutMax)) {
        return false
      }

      // Errors only
      if (filters.errorsOnly && !row.hasError) {
        return false
      }

      return true
    })
  }, [data?.data, filters])

  // Calculate chart data from filtered data
  const chartData = useMemo(() => {
    return calculateCategoryChartData(filteredData)
  }, [filteredData])

  // Calculate weekly trend from filtered data
  const weeklyTrend = useMemo(() => {
    return calculateWeeklyTrend(filteredData)
  }, [filteredData])

  // Calculate summary stats from all data
  const summaryStats = useMemo((): SummaryStats | null => {
    if (!data?.data) return null
    return calculateSummaryStats(data.data)
  }, [data?.data])

  // Calculate benchmarks
  const benchmarks = useMemo(() => {
    return calculateBenchmarks(filteredData, filters.categoryType)
  }, [filteredData, filters.categoryType])

  const handleRowClick = (row: ParsedSheetRow) => {
    setSelectedRow(row)
    setIsDrawerOpen(true)
  }

  const handleViewLinkDetail = (row: ParsedSheetRow) => {
    const name = row.raw['Name'] || row.raw['name'] || ''
    if (name) {
      router.push(`/link/${encodeURIComponent(name)}`)
    }
  }

  const handleRefresh = () => {
    fetchData(true)
  }

  const handleApplyPreset = (presetFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...initialFilters, ...presetFilters }))
  }

  const clearFilters = () => {
    setFilters(initialFilters)
  }

  // Error state
  if (error && !isLoading) {
    return (
      <TooltipProvider>
        <main className="min-h-screen bg-background">
          <div className="container py-8">
            <HeroSection stats={null} lastRefreshed={null} />
            <ErrorState
              error={error}
              troubleshooting={troubleshooting}
              onRetry={handleRefresh}
              isLoading={isLoading}
            />
          </div>
        </main>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      {/* Confetti celebration */}
      <Confetti active={confettiActive} />
      
      <main className="min-h-screen bg-background relative">
        {/* Animated background */}
        <div className="animated-bg" />
        
        <div className="container py-6 space-y-6 relative z-10">
          {/* Top bar with theme toggle */}
          <div className="flex justify-end gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="p-3">
                <KeyboardShortcutsHelp />
              </TooltipContent>
            </Tooltip>
            <ThemeToggle />
          </div>

          {/* Hero Section with Stats */}
          <HeroSection stats={summaryStats} lastRefreshed={lastRefreshed} />

          {/* Gamification Section */}
          {data && filteredData.length > 0 && (
            <div className="space-y-4">
              {/* Health Score & Streak */}
              <div className="grid gap-4 lg:grid-cols-2">
                <HealthScore 
                  data={filteredData} 
                  previousErrorCount={previousErrorCount}
                />
                <div className="space-y-4">
                  <StreakCounter 
                    data={filteredData}
                    errorCount={filteredData.filter(r => r.hasError).length}
                  />
                  <Achievements data={filteredData} />
                </div>
              </div>

              {/* AI Insights & Heat Map */}
              <div className="grid gap-4 lg:grid-cols-2">
                <AIInsights data={filteredData} categoryType={filters.categoryType} />
                <HeatMapCalendar currentData={data?.data || []} />
              </div>
            </div>
          )}

          {/* Historical Comparison */}
          <HistoricalComparison />

          {/* Alerts Panel */}
          {alerts.length > 0 && (
            <AlertsPanel 
              alerts={alerts} 
              onDismiss={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
            />
          )}

          {isLoading && !data ? (
            <LoadingSkeleton />
          ) : data ? (
            <>
              {/* Filters */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <Filters
                    filters={filters}
                    onFiltersChange={setFilters}
                    categories={categories}
                    locations={locations}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <FilterPresets 
                    currentFilters={filters} 
                    onApplyPreset={handleApplyPreset}
                  />
                  <ExportMenu 
                    data={filteredData}
                    headers={data.headers}
                    filteredCount={filteredData.length}
                    totalCount={data.data.length}
                  />
                  <Link href="/analytics">
                    <Button variant="outline" className="gap-2 border-purple-500/30 hover:bg-purple-500/10">
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </Button>
                  </Link>
                  <Button onClick={handleRefresh} disabled={isLoading} className="gradient-primary text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow btn-glow">
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Tabs for Table, Charts, and Benchmarks */}
              <Tabs defaultValue="table" className="space-y-4">
                <TabsList className="bg-muted/50 p-1 shadow-lg">
                  <TabsTrigger value="table" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 transition-all">
                    <Table2 className="h-4 w-4" />
                    Data Table
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 transition-all">
                    <BarChart3 className="h-4 w-4" />
                    Charts
                  </TabsTrigger>
                  <TabsTrigger value="benchmarks" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/30 transition-all">
                    <Trophy className="h-4 w-4" />
                    Rankings
                  </TabsTrigger>
                  <TabsTrigger value="weekly" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 transition-all">
                    <GitCompare className="h-4 w-4" />
                    Weekly Changes
                  </TabsTrigger>
                  <TabsTrigger value="report" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-rose-500/30 transition-all">
                    <FileText className="h-4 w-4" />
                    Daily Report
                  </TabsTrigger>
                  <TabsTrigger value="summaries" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/30 transition-all">
                    <CalendarDays className="h-4 w-4" />
                    Summaries
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="table" className="space-y-4">
                  {/* Result count */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing <span className="font-semibold text-foreground">{filteredData.length}</span> of{' '}
                      <span className="font-semibold text-foreground">{data.data.length}</span> rows
                      {filters.categoryType !== 'all' && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {filters.categoryType}
                        </span>
                      )}
                      {filters.errorsOnly && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                          Errors only
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Auto-refreshes every 10s • Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">/</kbd> to search
                    </div>
                  </div>

                  {filteredData.length > 0 ? (
                    <DataTable
                      data={filteredData}
                      headers={data.headers}
                      onRowClick={handleRowClick}
                    />
                  ) : (
                    <EmptyState
                      type="no-results"
                      onAction={clearFilters}
                      actionLabel="Clear Filters"
                    />
                  )}
                </TabsContent>

                <TabsContent value="charts" className="space-y-6">
                  {chartData.length > 0 ? (
                    <>
                      <Charts 
                        data={chartData} 
                        weeklyTrend={weeklyTrend}
                        categoryType={filters.categoryType}
                        filteredRows={filteredData}
                      />
                      
                      {/* Advanced Visualizations */}
                      <div className="pt-6 border-t">
                        <h3 className="text-xl font-semibold mb-4 text-gradient-secondary">
                          Advanced Visualizations
                        </h3>
                        <AdvancedCharts 
                          data={filteredData}
                          categoryType={filters.categoryType}
                        />
                      </div>
                    </>
                  ) : (
                    <EmptyState type="no-data" />
                  )}
                </TabsContent>

                <TabsContent value="benchmarks" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Performance Rankings</h3>
                      <p className="text-sm text-muted-foreground">
                        Links ranked by days out (lower is better)
                        {filters.categoryType !== 'all' && ` • Filtered to ${filters.categoryType}`}
                      </p>
                    </div>
                  </div>
                  
                  {benchmarks.length > 0 ? (
                    <BenchmarksTable benchmarks={benchmarks} showTop={20} />
                  ) : (
                    <EmptyState type="no-data" />
                  )}
                </TabsContent>

                <TabsContent value="weekly" className="space-y-4">
                  <LinkPerformanceTracker currentData={filteredData} />
                </TabsContent>

                <TabsContent value="report" className="space-y-4">
                  <DailyReport data={filteredData} categoryType={filters.categoryType} />
                </TabsContent>

                <TabsContent value="summaries" className="space-y-4">
                  <DataSummaries data={filteredData} categoryType={filters.categoryType} />
                </TabsContent>
              </Tabs>

              {/* Row Detail Drawer */}
              <RowDrawer
                row={selectedRow}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                headers={data.headers}
              />
            </>
          ) : null}
        </div>

        {/* Suggestions Box */}
        <div className="container py-8 relative z-10">
          <SuggestionsBox />
        </div>

        {/* Footer */}
        <footer className="border-t mt-8 py-8 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 relative z-10">
          <div className="container text-center">
            <p className="text-lg font-semibold text-gradient-primary">
              Oncehub Availability Report
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Automated monitoring for healthcare appointment availability
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
                Google Sheets Data Source
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></span>
                10s Auto-Refresh
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></span>
                {data?.source === 'api' ? 'API Connected' : 'CSV Export'}
              </span>
            </div>
          </div>
        </footer>
      </main>
    </TooltipProvider>
  )
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}
