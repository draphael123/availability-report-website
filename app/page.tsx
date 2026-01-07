'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, BarChart3, Table2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Filters } from '@/components/filters'
import { DataTable } from '@/components/data-table'
import { RowDrawer } from '@/components/row-drawer'
import { Charts } from '@/components/charts'
import { ErrorState } from '@/components/error-state'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { FilterState, ParsedSheetRow, SheetDataResponse } from '@/lib/types'
import { getUniqueColumnValues, calculateCategoryChartData } from '@/lib/sheet-parser'

const initialFilters: FilterState = {
  globalSearch: '',
  category: null,
  location: null,
  daysOutMin: null,
  daysOutMax: null,
  errorsOnly: false,
}

export default function Dashboard() {
  const [data, setData] = useState<SheetDataResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [troubleshooting, setTroubleshooting] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [selectedRow, setSelectedRow] = useState<ParsedSheetRow | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const fetchData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true)
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

  useEffect(() => {
    fetchData()
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
      // Global search
      if (filters.globalSearch) {
        const search = filters.globalSearch.toLowerCase()
        const searchableFields = ['Category', 'Location', 'Name', 'Error Details']
        const matches = searchableFields.some((field) => {
          const value = row.raw[field]
          return value && value.toLowerCase().includes(search)
        })
        if (!matches) return false
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

  const handleRowClick = (row: ParsedSheetRow) => {
    setSelectedRow(row)
    setIsDrawerOpen(true)
  }

  const handleRefresh = () => {
    fetchData(true)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Error state
  if (error && !isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Oncehub Availability Report
            </h1>
          </header>
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
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Oncehub Availability Report
            </h1>
            {data && (
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Last refreshed: {formatTime(data.fetchedAt)}
                </span>
                <Badge variant="outline" className="text-xs">
                  via {data.source.toUpperCase()}
                </Badge>
              </div>
            )}
          </div>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </header>

        {isLoading && !data ? (
          <LoadingSkeleton />
        ) : data ? (
          <>
            {/* Filters */}
            <Filters
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
              locations={locations}
            />

            {/* Tabs for Table and Charts */}
            <Tabs defaultValue="table" className="space-y-4">
              <TabsList>
                <TabsTrigger value="table" className="gap-2">
                  <Table2 className="h-4 w-4" />
                  Data Table
                </TabsTrigger>
                <TabsTrigger value="charts" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Charts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="table" className="space-y-4">
                {/* Result count */}
                <div className="text-sm text-muted-foreground">
                  Showing {filteredData.length} of {data.data.length} rows
                  {filters.errorsOnly && ` (errors only)`}
                </div>

                <DataTable
                  data={filteredData}
                  headers={data.headers}
                  onRowClick={handleRowClick}
                />
              </TabsContent>

              <TabsContent value="charts">
                {chartData.length > 0 ? (
                  <Charts data={chartData} />
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
    </main>
  )
}

