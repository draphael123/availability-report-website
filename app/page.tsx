'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, BarChart3, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Filters } from '@/components/filters'
import { DataTable } from '@/components/data-table'
import { RowDrawer } from '@/components/row-drawer'
import { Charts } from '@/components/charts'
import { ErrorState } from '@/components/error-state'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { HeroSection } from '@/components/hero-section'
import { FilterState, ParsedSheetRow, SheetDataResponse, SummaryStats } from '@/lib/types'
import { 
  getUniqueColumnValues, 
  calculateCategoryChartData,
  calculateWeeklyTrend,
  calculateSummaryStats 
} from '@/lib/sheet-parser'

const initialFilters: FilterState = {
  globalSearch: '',
  categoryType: 'all',
  category: null,
  location: null,
  daysOutMin: null,
  daysOutMax: null,
  errorsOnly: false,
}

// Auto-refresh interval (30 seconds)
const AUTO_REFRESH_INTERVAL = 30 * 1000

export default function Dashboard() {
  const [data, setData] = useState<SheetDataResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [troubleshooting, setTroubleshooting] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [selectedRow, setSelectedRow] = useState<ParsedSheetRow | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null)

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
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true, true) // Silent refresh
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchData])

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
      // Global search - search across multiple fields
      if (filters.globalSearch) {
        const search = filters.globalSearch.toLowerCase()
        const searchableFields = ['Category', 'Location', 'Name', 'Error Details', 'URL', 'Error Code']
        const matches = searchableFields.some((field) => {
          const value = row.raw[field]
          return value && value.toLowerCase().includes(search)
        })
        // Also search in all fields if no match found in primary fields
        if (!matches) {
          const allFieldsMatch = Object.values(row.raw).some(
            value => value && value.toLowerCase().includes(search)
          )
          if (!allFieldsMatch) return false
        }
      }

      // Category type filter (HRT, TRT, Provider)
      if (filters.categoryType !== 'all' && row.categoryType !== filters.categoryType) {
        return false
      }

      // Category filter
      if (filters.category && row.raw['Category'] !== filters.category) {
        return false
      }

      // Location filter
      if (filters.location && row.raw['Location'] !== filters.location) {
        return false
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

  const handleRowClick = (row: ParsedSheetRow) => {
    setSelectedRow(row)
    setIsDrawerOpen(true)
  }

  const handleRefresh = () => {
    fetchData(true)
  }

  // Error state
  if (error && !isLoading) {
    return (
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
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container py-6 space-y-6">
        {/* Hero Section with Stats */}
        <HeroSection stats={summaryStats} lastRefreshed={lastRefreshed} />

        {isLoading && !data ? (
          <LoadingSkeleton />
        ) : data ? (
          <>
            {/* Filters */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <Filters
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                  locations={locations}
                />
              </div>
              <Button onClick={handleRefresh} disabled={isLoading} className="gradient-primary text-white shadow-lg">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Refreshing...' : 'Refresh Now'}
              </Button>
            </div>

            {/* Tabs for Table and Charts */}
            <Tabs defaultValue="table" className="space-y-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="table" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Table2 className="h-4 w-4" />
                  Data Table
                </TabsTrigger>
                <TabsTrigger value="charts" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BarChart3 className="h-4 w-4" />
                  Charts & Analytics
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
                    Auto-refreshes every 30 seconds
                  </div>
                </div>

                <DataTable
                  data={filteredData}
                  headers={data.headers}
                  onRowClick={handleRowClick}
                />
              </TabsContent>

              <TabsContent value="charts">
                {chartData.length > 0 ? (
                  <Charts 
                    data={chartData} 
                    weeklyTrend={weeklyTrend}
                    categoryType={filters.categoryType}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No data available for charts
                  </div>
                )}
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

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-muted/30">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            <strong>Oncehub Availability Report</strong> — Automated monitoring for healthcare appointment availability
          </p>
          <p className="mt-1">
            Data sourced from Google Sheets • Auto-refreshes every 30 seconds • 
            {data?.source === 'api' ? ' Using Google Sheets API' : ' Using CSV export'}
          </p>
        </div>
      </footer>
    </main>
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
