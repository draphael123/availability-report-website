'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  FileText, 
  Download, 
  Calendar,
  Clock,
  Settings,
  Loader2,
  CheckCircle,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ParsedSheetRow } from '@/lib/types'
import { getSLATargets } from '@/lib/preferences'
import { cn } from '@/lib/utils'

interface ScheduledReportsProps {
  data: ParsedSheetRow[]
}

type ReportType = 'daily' | 'weekly' | 'monthly'

interface ReportConfig {
  type: ReportType
  includeSummary: boolean
  includeTopPerformers: boolean
  includeNeedsAttention: boolean
  includeErrors: boolean
  includeTrends: boolean
}

const DEFAULT_CONFIG: ReportConfig = {
  type: 'daily',
  includeSummary: true,
  includeTopPerformers: true,
  includeNeedsAttention: true,
  includeErrors: true,
  includeTrends: true,
}

export function ScheduledReports({ data }: ScheduledReportsProps) {
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG)
  const [generating, setGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)

  const slaTargets = getSLATargets()

  // Calculate report data
  const reportData = useMemo(() => {
    const withDaysOut = data.filter(r => r.daysOut !== null)
    const sorted = [...withDaysOut].sort((a, b) => a.daysOut! - b.daysOut!)
    
    const avgDaysOut = withDaysOut.length > 0
      ? withDaysOut.reduce((s, r) => s + r.daysOut!, 0) / withDaysOut.length
      : null

    const excellent = withDaysOut.filter(r => r.daysOut! <= slaTargets.excellent)
    const good = withDaysOut.filter(r => r.daysOut! > slaTargets.excellent && r.daysOut! <= slaTargets.good)
    const acceptable = withDaysOut.filter(r => r.daysOut! > slaTargets.good && r.daysOut! <= slaTargets.acceptable)
    const needsAttention = withDaysOut.filter(r => r.daysOut! > slaTargets.acceptable)
    const errors = data.filter(r => r.hasError)

    // Calculate by category type
    const byType = {
      HRT: data.filter(r => r.categoryType === 'HRT'),
      TRT: data.filter(r => r.categoryType === 'TRT'),
      Provider: data.filter(r => r.categoryType === 'Provider'),
    }

    return {
      total: data.length,
      withData: withDaysOut.length,
      avgDaysOut,
      excellent,
      good,
      acceptable,
      needsAttention,
      errors,
      topPerformers: sorted.slice(0, 10),
      worstPerformers: sorted.slice(-10).reverse(),
      byType,
    }
  }, [data, slaTargets])

  const generateTextReport = () => {
    const today = new Date()
    const periodLabel = config.type === 'daily' ? 'Daily' : config.type === 'weekly' ? 'Weekly' : 'Monthly'
    
    let report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                     ONCEHUB AVAILABILITY ${periodLabel.toUpperCase()} REPORT                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

Generated: ${today.toLocaleString()}
Report Type: ${periodLabel}
SLA Targets: Excellent ≤${slaTargets.excellent}d, Good ≤${slaTargets.good}d, Acceptable ≤${slaTargets.acceptable}d

`

    if (config.includeSummary) {
      report += `
════════════════════════════════════════════════════════════════════════════════
                                  SUMMARY
════════════════════════════════════════════════════════════════════════════════

Total Links Monitored: ${reportData.total}
Links with Data: ${reportData.withData}
Average Wait Time: ${reportData.avgDaysOut?.toFixed(1) || 'N/A'} days

SLA Compliance:
  ✓ Excellent (≤${slaTargets.excellent}d): ${reportData.excellent.length} links (${((reportData.excellent.length / reportData.withData) * 100).toFixed(1)}%)
  ✓ Good (≤${slaTargets.good}d): ${reportData.good.length} links (${((reportData.good.length / reportData.withData) * 100).toFixed(1)}%)
  ⚠ Acceptable (≤${slaTargets.acceptable}d): ${reportData.acceptable.length} links (${((reportData.acceptable.length / reportData.withData) * 100).toFixed(1)}%)
  ✗ Needs Attention (>${slaTargets.acceptable}d): ${reportData.needsAttention.length} links (${((reportData.needsAttention.length / reportData.withData) * 100).toFixed(1)}%)

By Category Type:
  • HRT: ${reportData.byType.HRT.length} links
  • TRT: ${reportData.byType.TRT.length} links  
  • Provider: ${reportData.byType.Provider.length} links

`
    }

    if (config.includeTopPerformers) {
      report += `
════════════════════════════════════════════════════════════════════════════════
                           TOP 10 BEST PERFORMERS
════════════════════════════════════════════════════════════════════════════════
Links with the shortest wait times:

`
      reportData.topPerformers.forEach((r, i) => {
        report += `  ${String(i + 1).padStart(2)}. ${r.raw['Name']?.padEnd(40) || 'Unknown'.padEnd(40)} ${String(r.daysOut).padStart(3)}d  (${r.raw['Location'] || 'Unknown'})\n`
      })
    }

    if (config.includeNeedsAttention) {
      report += `
════════════════════════════════════════════════════════════════════════════════
                         TOP 10 NEEDS ATTENTION
════════════════════════════════════════════════════════════════════════════════
Links with the longest wait times:

`
      reportData.worstPerformers.forEach((r, i) => {
        report += `  ${String(i + 1).padStart(2)}. ${r.raw['Name']?.padEnd(40) || 'Unknown'.padEnd(40)} ${String(r.daysOut).padStart(3)}d  (${r.raw['Location'] || 'Unknown'})\n`
      })
    }

    if (config.includeErrors && reportData.errors.length > 0) {
      report += `
════════════════════════════════════════════════════════════════════════════════
                              ERRORS DETECTED
════════════════════════════════════════════════════════════════════════════════
${reportData.errors.length} link(s) with errors:

`
      reportData.errors.slice(0, 15).forEach((r, i) => {
        const errorInfo = r.raw['Error Details'] || r.raw['Error Code'] || 'Unknown error'
        report += `  ${String(i + 1).padStart(2)}. ${r.raw['Name']?.padEnd(35) || 'Unknown'.padEnd(35)} ${errorInfo.slice(0, 30)}\n`
      })
      if (reportData.errors.length > 15) {
        report += `\n  ... and ${reportData.errors.length - 15} more errors\n`
      }
    }

    if (config.includeTrends) {
      const healthScore = reportData.withData > 0
        ? ((reportData.excellent.length + reportData.good.length) / reportData.withData * 100)
        : 0
      
      report += `
════════════════════════════════════════════════════════════════════════════════
                           PERFORMANCE INDICATORS
════════════════════════════════════════════════════════════════════════════════

Overall Health Score: ${healthScore.toFixed(0)}%
  (Percentage of links meeting Good or Excellent SLA)

Category Distribution:
  • Under 2 days: ${'█'.repeat(Math.round(reportData.excellent.length / reportData.withData * 20))} ${reportData.excellent.length}
  • 2-4 days:     ${'█'.repeat(Math.round(reportData.good.length / reportData.withData * 20))} ${reportData.good.length}
  • 4-7 days:     ${'█'.repeat(Math.round(reportData.acceptable.length / reportData.withData * 20))} ${reportData.acceptable.length}
  • 7+ days:      ${'█'.repeat(Math.round(reportData.needsAttention.length / reportData.withData * 20))} ${reportData.needsAttention.length}

`
    }

    report += `
════════════════════════════════════════════════════════════════════════════════
                                END OF REPORT
════════════════════════════════════════════════════════════════════════════════
Generated by Oncehub Availability Report Dashboard
https://oncehub-availability-report.vercel.app
`

    return report
  }

  const downloadReport = async (format: 'txt' | 'csv') => {
    setGenerating(true)
    
    // Simulate generation delay
    await new Promise(r => setTimeout(r, 500))
    
    let content: string
    let filename: string
    let type: string
    
    const today = new Date().toISOString().split('T')[0]
    
    if (format === 'txt') {
      content = generateTextReport()
      filename = `oncehub-${config.type}-report-${today}.txt`
      type = 'text/plain'
    } else {
      // CSV format
      const headers = ['Name', 'Location', 'Category', 'Category Type', 'Days Out', 'SLA Status', 'Has Error', 'URL']
      const rows = data.map(r => {
        let slaStatus = 'Unknown'
        if (r.daysOut !== null) {
          if (r.daysOut <= slaTargets.excellent) slaStatus = 'Excellent'
          else if (r.daysOut <= slaTargets.good) slaStatus = 'Good'
          else if (r.daysOut <= slaTargets.acceptable) slaStatus = 'Acceptable'
          else slaStatus = 'Needs Attention'
        }
        return [
          r.raw['Name'] || '',
          r.raw['Location'] || '',
          r.raw['Category'] || '',
          r.categoryType,
          r.daysOut?.toString() || '',
          slaStatus,
          r.hasError ? 'Yes' : 'No',
          r.raw['URL'] || '',
        ]
      })
      content = [headers, ...rows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n')
      filename = `oncehub-${config.type}-data-${today}.csv`
      type = 'text/csv'
    }
    
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    
    setLastGenerated(new Date().toLocaleString())
    setGenerating(false)
  }

  return (
    <Card className="glass border-blue-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-gradient-secondary">Report Generator</span>
            </CardTitle>
            <CardDescription>Generate customized reports on demand</CardDescription>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Settings</DialogTitle>
                <DialogDescription>
                  Customize what's included in your reports
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select 
                    value={config.type} 
                    onValueChange={(v) => setConfig(c => ({ ...c, type: v as ReportType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Report</SelectItem>
                      <SelectItem value="weekly">Weekly Report</SelectItem>
                      <SelectItem value="monthly">Monthly Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <Label>Include Sections</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal">Summary Statistics</Label>
                      <p className="text-xs text-muted-foreground">Overall metrics and SLA compliance</p>
                    </div>
                    <Switch
                      checked={config.includeSummary}
                      onCheckedChange={(v) => setConfig(c => ({ ...c, includeSummary: v }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal">Top Performers</Label>
                      <p className="text-xs text-muted-foreground">Links with shortest wait times</p>
                    </div>
                    <Switch
                      checked={config.includeTopPerformers}
                      onCheckedChange={(v) => setConfig(c => ({ ...c, includeTopPerformers: v }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal">Needs Attention</Label>
                      <p className="text-xs text-muted-foreground">Links with longest wait times</p>
                    </div>
                    <Switch
                      checked={config.includeNeedsAttention}
                      onCheckedChange={(v) => setConfig(c => ({ ...c, includeNeedsAttention: v }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal">Error Report</Label>
                      <p className="text-xs text-muted-foreground">Links with errors</p>
                    </div>
                    <Switch
                      checked={config.includeErrors}
                      onCheckedChange={(v) => setConfig(c => ({ ...c, includeErrors: v }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal">Performance Trends</Label>
                      <p className="text-xs text-muted-foreground">Health score and distribution</p>
                    </div>
                    <Switch
                      checked={config.includeTrends}
                      onCheckedChange={(v) => setConfig(c => ({ ...c, includeTrends: v }))}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-emerald-500">{reportData.excellent.length}</div>
            <div className="text-[10px] text-muted-foreground">Excellent</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-blue-500">{reportData.good.length}</div>
            <div className="text-[10px] text-muted-foreground">Good</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-amber-500">{reportData.acceptable.length}</div>
            <div className="text-[10px] text-muted-foreground">Acceptable</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-red-500">{reportData.needsAttention.length}</div>
            <div className="text-[10px] text-muted-foreground">Attention</div>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => downloadReport('txt')}
            disabled={generating}
            className="flex-1 gap-2"
            variant="outline"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Download Report (.txt)
          </Button>
          <Button
            onClick={() => downloadReport('csv')}
            disabled={generating}
            className="flex-1 gap-2"
            variant="outline"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Download Data (.csv)
          </Button>
        </div>

        {lastGenerated && (
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            Last generated: {lastGenerated}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

