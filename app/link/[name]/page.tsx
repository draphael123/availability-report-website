'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Hash,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { CopyButton } from '@/components/copy-button'
import { ParsedSheetRow, SheetDataResponse } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function LinkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const linkName = decodeURIComponent(params.name as string)
  
  const [data, setData] = useState<SheetDataResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sheet')
        const result: SheetDataResponse = await res.json()
        if (result.success) {
          setData({
            ...result,
            data: result.data.map((row) => ({
              ...row,
              scrapedAt: row.scrapedAt ? new Date(row.scrapedAt) : null,
            })),
          })
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const linkData = useMemo(() => {
    if (!data?.data) return null
    return data.data.find(row => {
      const name = row.raw['Name'] || row.raw['name'] || ''
      return name === linkName
    })
  }, [data, linkName])

  const categoryStats = useMemo(() => {
    if (!data?.data || !linkData) return null
    
    const sameCategory = data.data.filter(r => r.categoryType === linkData.categoryType)
    const withDaysOut = sameCategory.filter(r => r.daysOut !== null)
    const avgDaysOut = withDaysOut.length > 0
      ? withDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / withDaysOut.length
      : null

    // Find rank
    const sorted = [...sameCategory]
      .filter(r => r.daysOut !== null)
      .sort((a, b) => a.daysOut! - b.daysOut!)
    const rank = linkData.daysOut !== null 
      ? sorted.findIndex(r => r.raw['Name'] === linkName || r.raw['name'] === linkName) + 1
      : null

    return {
      totalInCategory: sameCategory.length,
      avgDaysOut,
      rank,
    }
  }, [data, linkData, linkName])

  // Mock historical data (in production, this would come from actual history)
  const mockHistory = useMemo(() => {
    if (!linkData) return []
    const baseValue = linkData.daysOut || 14
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        daysOut: Math.max(1, baseValue + Math.floor(Math.random() * 10) - 5),
        score: linkData.availabilityScore ? Math.max(0, Math.min(100, (linkData.availabilityScore + Math.floor(Math.random() * 20) - 10))) : null,
      }
    })
  }, [linkData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!linkData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardContent className="py-16 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Link Not Found</h2>
              <p className="text-muted-foreground">
                Could not find a link with the name "{linkName}"
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const url = linkData.raw['URL'] || linkData.raw['url'] || ''
  const category = linkData.raw['Category'] || linkData.raw['category'] || ''
  const location = linkData.raw['Location'] || linkData.raw['location'] || ''

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <ThemeToggle />
        </div>

        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{linkName}</h1>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    linkData.categoryType === 'HRT' ? 'badge-hrt' :
                    linkData.categoryType === 'TRT' ? 'badge-trt' :
                    linkData.categoryType === 'Provider' ? 'badge-provider' : ''
                  )}
                >
                  {linkData.categoryType !== 'all' ? linkData.categoryType : 'Other'}
                </Badge>
                {linkData.hasError && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Error
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {category && <span>{category}</span>}
                {location && (
                  <>
                    <span>•</span>
                    <span>{location}</span>
                  </>
                )}
              </div>
            </div>
            {url && (
              <div className="flex items-center gap-2">
                <CopyButton text={url} />
                <Button asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Link
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="stat-card-blue">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Calendar className="h-4 w-4" />
                Days Out
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {linkData.daysOut ?? 'N/A'}
              </div>
              {categoryStats?.avgDaysOut && linkData.daysOut && (
                <div className={cn(
                  'text-xs mt-1 flex items-center gap-1',
                  linkData.daysOut < categoryStats.avgDaysOut ? 'text-green-600' : 'text-red-600'
                )}>
                  {linkData.daysOut < categoryStats.avgDaysOut ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {Math.abs(linkData.daysOut - categoryStats.avgDaysOut).toFixed(1)} vs avg
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="stat-card-purple">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Hash className="h-4 w-4" />
                Availability Score
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {linkData.availabilityScore ?? 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card-green">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                Category Rank
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {categoryStats?.rank ? `#${categoryStats.rank}` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                of {categoryStats?.totalInCategory || 0} in {linkData.categoryType || 'category'}
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card-pink">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="h-4 w-4" />
                Last Scraped
              </div>
              <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                {linkData.scrapedAt?.toLocaleDateString() ?? 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {linkData.scrapedAt?.toLocaleTimeString() ?? ''}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Days Out Trend (Last 7 Days)</CardTitle>
              <CardDescription>Historical days out values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockHistory}>
                    <defs>
                      <linearGradient id="colorDaysOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="daysOut"
                      stroke="hsl(199, 89%, 48%)"
                      fillOpacity={1}
                      fill="url(#colorDaysOut)"
                      name="Days Out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Availability Score Trend</CardTitle>
              <CardDescription>Historical availability scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockHistory}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(262, 83%, 58%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(262, 83%, 58%)' }}
                      name="Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Data Fields</CardTitle>
            <CardDescription>Complete raw data for this link</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {data?.headers.map(header => {
                const value = linkData.raw[header]
                const isErrorField = header.toLowerCase().includes('error')
                
                return (
                  <div
                    key={header}
                    className={cn(
                      'p-3 rounded-lg',
                      isErrorField && value ? 'bg-red-50 dark:bg-red-900/20' : 'bg-muted/50'
                    )}
                  >
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {header}
                    </div>
                    <div className="text-sm break-words">
                      {header.toLowerCase() === 'url' && value ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {value.length > 50 ? value.substring(0, 50) + '...' : value}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        value || <span className="text-muted-foreground italic">Empty</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



