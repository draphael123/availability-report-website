'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  BarChart3, 
  Target, 
  MapPin, 
  Zap, 
  Bug, 
  Shield, 
  Heart, 
  Clock,
  Scale,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SLATracking } from '@/components/sla-tracking'
import { GeographicInsights } from '@/components/geographic-insights'
import { PredictiveAnalytics } from '@/components/predictive-analytics'
import { ErrorAnalysis } from '@/components/error-analysis'
import { DataQuality } from '@/components/data-quality'
import { PatientImpact } from '@/components/patient-impact'
import { TimePatterns } from '@/components/time-patterns'
import { ComparativeBenchmarks } from '@/components/comparative-benchmarks'
import { ParsedSheetRow, SheetDataResponse } from '@/lib/types'

export default function InsightsPage() {
  const [data, setData] = useState<SheetDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sheet')
        const result = await res.json()
        if (result.success) {
          setData(result)
          setLastRefreshed(new Date().toLocaleString())
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sheet?refresh=true')
      const result = await res.json()
      if (result.success) {
        setData(result)
        setLastRefreshed(new Date().toLocaleString())
      }
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    )
  }

  if (!data?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load data</p>
          <Button onClick={handleRefresh} className="mt-4">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">Advanced Insights</h1>
              <p className="text-muted-foreground">
                Deep-dive analytics and performance metrics
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-muted-foreground">
                Last refreshed: {lastRefreshed}
              </span>
            )}
            <Button 
              onClick={handleRefresh} 
              disabled={loading}
              className="gradient-primary text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg glass border text-center">
            <div className="text-3xl font-bold text-gradient-primary">{data.data.length}</div>
            <div className="text-sm text-muted-foreground">Total Links</div>
          </div>
          <div className="p-4 rounded-lg glass border text-center">
            <div className="text-3xl font-bold text-gradient-secondary">
              {(data.data.filter(r => r.daysOut !== null).reduce((s, r) => s + r.daysOut!, 0) / 
                data.data.filter(r => r.daysOut !== null).length).toFixed(1)}d
            </div>
            <div className="text-sm text-muted-foreground">Avg Wait Time</div>
          </div>
          <div className="p-4 rounded-lg glass border text-center">
            <div className="text-3xl font-bold text-emerald-400">
              {data.data.filter(r => r.daysOut !== null && r.daysOut < 4).length}
            </div>
            <div className="text-sm text-muted-foreground">Under 4 Days</div>
          </div>
          <div className="p-4 rounded-lg glass border text-center">
            <div className="text-3xl font-bold text-red-400">
              {data.data.filter(r => r.hasError).length}
            </div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sla" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="sla" className="gap-2 text-xs sm:text-sm">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">SLA Tracking</span>
              <span className="sm:hidden">SLA</span>
            </TabsTrigger>
            <TabsTrigger value="geographic" className="gap-2 text-xs sm:text-sm">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Geographic</span>
              <span className="sm:hidden">Geo</span>
            </TabsTrigger>
            <TabsTrigger value="predictive" className="gap-2 text-xs sm:text-sm">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Predictive</span>
              <span className="sm:hidden">Predict</span>
            </TabsTrigger>
            <TabsTrigger value="errors" className="gap-2 text-xs sm:text-sm">
              <Bug className="h-4 w-4" />
              <span className="hidden sm:inline">Error Analysis</span>
              <span className="sm:hidden">Errors</span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="gap-2 text-xs sm:text-sm">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Data Quality</span>
              <span className="sm:hidden">Quality</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="gap-2 text-xs sm:text-sm">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Patient Impact</span>
              <span className="sm:hidden">Impact</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="gap-2 text-xs sm:text-sm">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Time Patterns</span>
              <span className="sm:hidden">Time</span>
            </TabsTrigger>
            <TabsTrigger value="benchmarks" className="gap-2 text-xs sm:text-sm">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Benchmarks</span>
              <span className="sm:hidden">Compare</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sla">
            <SLATracking data={data.data} />
          </TabsContent>

          <TabsContent value="geographic">
            <GeographicInsights data={data.data} />
          </TabsContent>

          <TabsContent value="predictive">
            <PredictiveAnalytics data={data.data} />
          </TabsContent>

          <TabsContent value="errors">
            <ErrorAnalysis data={data.data} />
          </TabsContent>

          <TabsContent value="quality">
            <DataQuality 
              data={data.data} 
              lastRefreshed={lastRefreshed}
              source={data.source as 'API' | 'CSV' | undefined}
            />
          </TabsContent>

          <TabsContent value="impact">
            <PatientImpact data={data.data} />
          </TabsContent>

          <TabsContent value="time">
            <TimePatterns data={data.data} />
          </TabsContent>

          <TabsContent value="benchmarks">
            <ComparativeBenchmarks data={data.data} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

