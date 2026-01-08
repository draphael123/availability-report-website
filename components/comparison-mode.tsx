'use client'

import { useState, useMemo } from 'react'
import { GitCompare, X, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ParsedSheetRow } from '@/lib/types'
import { getSLATargets, getSLAStatus, calculateHealthScore } from '@/lib/preferences'
import { cn } from '@/lib/utils'

interface ComparisonModeProps {
  data: ParsedSheetRow[]
}

export function ComparisonMode({ data }: ComparisonModeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [leftLink, setLeftLink] = useState<string>('')
  const [rightLink, setRightLink] = useState<string>('')
  
  const slaTargets = getSLATargets()

  const linkOptions = useMemo(() => {
    return data.map(row => ({
      value: row.raw['Name'] || `Row ${row.rowIndex}`,
      label: row.raw['Name'] || `Row ${row.rowIndex}`,
      location: row.raw['Location'] || 'Unknown',
    }))
  }, [data])

  const leftData = useMemo(() => {
    return data.find(row => (row.raw['Name'] || `Row ${row.rowIndex}`) === leftLink)
  }, [data, leftLink])

  const rightData = useMemo(() => {
    return data.find(row => (row.raw['Name'] || `Row ${row.rowIndex}`) === rightLink)
  }, [data, rightLink])

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="gap-2 border-purple-500/30 hover:bg-purple-500/10"
      >
        <GitCompare className="h-4 w-4" />
        Compare Links
      </Button>
    )
  }

  const renderComparison = (label: string, leftVal: string | number | null, rightVal: string | number | null, lowerIsBetter = false) => {
    const leftNum = typeof leftVal === 'number' ? leftVal : null
    const rightNum = typeof rightVal === 'number' ? rightVal : null
    
    let comparison: 'better' | 'worse' | 'same' | null = null
    if (leftNum !== null && rightNum !== null) {
      if (lowerIsBetter) {
        comparison = leftNum < rightNum ? 'better' : leftNum > rightNum ? 'worse' : 'same'
      } else {
        comparison = leftNum > rightNum ? 'better' : leftNum < rightNum ? 'worse' : 'same'
      }
    }

    return (
      <div className="grid grid-cols-3 gap-4 py-2 border-b border-muted/50 last:border-0">
        <div className={cn(
          "text-right font-mono",
          comparison === 'better' && "text-emerald-500 font-semibold",
          comparison === 'worse' && "text-red-500"
        )}>
          {leftVal ?? '—'}
        </div>
        <div className="text-center text-xs text-muted-foreground">
          {label}
        </div>
        <div className={cn(
          "font-mono",
          comparison === 'worse' && "text-emerald-500 font-semibold",
          comparison === 'better' && "text-red-500"
        )}>
          {rightVal ?? '—'}
        </div>
      </div>
    )
  }

  return (
    <Card className="glass border-purple-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-purple-500" />
            <span className="text-gradient-primary">Compare Links</span>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Select two links to compare their performance side-by-side
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Link Selectors */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Link A</label>
            <Select value={leftLink} onValueChange={setLeftLink}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a link..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {linkOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span className="truncate max-w-[200px]">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.location}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Link B</label>
            <Select value={rightLink} onValueChange={setRightLink}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a link..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {linkOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span className="truncate max-w-[200px]">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.location}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Results */}
        {leftData && rightData ? (
          <div className="space-y-4">
            {/* Headers */}
            <div className="grid grid-cols-3 gap-4 pb-2 border-b">
              <div className="text-right">
                <p className="font-semibold truncate" title={leftLink}>{leftLink}</p>
                <Badge variant="outline" className={cn(
                  "text-[10px]",
                  leftData.categoryType === 'HRT' && "bg-pink-500/10 text-pink-500",
                  leftData.categoryType === 'TRT' && "bg-blue-500/10 text-blue-500",
                  leftData.categoryType === 'Provider' && "bg-purple-500/10 text-purple-500"
                )}>
                  {leftData.categoryType === 'all' ? 'Other' : leftData.categoryType}
                </Badge>
              </div>
              <div className="text-center">
                <ArrowRight className="h-5 w-5 mx-auto text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold truncate" title={rightLink}>{rightLink}</p>
                <Badge variant="outline" className={cn(
                  "text-[10px]",
                  rightData.categoryType === 'HRT' && "bg-pink-500/10 text-pink-500",
                  rightData.categoryType === 'TRT' && "bg-blue-500/10 text-blue-500",
                  rightData.categoryType === 'Provider' && "bg-purple-500/10 text-purple-500"
                )}>
                  {rightData.categoryType === 'all' ? 'Other' : rightData.categoryType}
                </Badge>
              </div>
            </div>

            {/* Health Scores */}
            <div className="grid grid-cols-3 gap-4 py-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className={cn(
                  "text-3xl font-bold",
                  calculateHealthScore(leftData.daysOut, leftData.hasError, slaTargets).color
                )}>
                  {calculateHealthScore(leftData.daysOut, leftData.hasError, slaTargets).grade}
                </div>
                <div className="text-xs text-muted-foreground">Health Score</div>
              </div>
              <div className="flex items-center justify-center">
                {leftData.daysOut !== null && rightData.daysOut !== null && (
                  leftData.daysOut < rightData.daysOut ? (
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {rightData.daysOut - leftData.daysOut}d better
                    </Badge>
                  ) : leftData.daysOut > rightData.daysOut ? (
                    <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {leftData.daysOut - rightData.daysOut}d worse
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                      <Minus className="h-3 w-3 mr-1" />
                      Same
                    </Badge>
                  )
                )}
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-3xl font-bold",
                  calculateHealthScore(rightData.daysOut, rightData.hasError, slaTargets).color
                )}>
                  {calculateHealthScore(rightData.daysOut, rightData.hasError, slaTargets).grade}
                </div>
                <div className="text-xs text-muted-foreground">Health Score</div>
              </div>
            </div>

            {/* Detailed Comparison */}
            <div className="text-sm">
              {renderComparison('Days Out', leftData.daysOut, rightData.daysOut, true)}
              {renderComparison('Location', leftData.raw['Location'], rightData.raw['Location'])}
              {renderComparison('Category', leftData.raw['Category'], rightData.raw['Category'])}
              {renderComparison('Has Error', leftData.hasError ? 'Yes' : 'No', rightData.hasError ? 'Yes' : 'No')}
              {renderComparison('Availability Score', leftData.availabilityScore, rightData.availabilityScore)}
            </div>

            {/* Winner */}
            {leftData.daysOut !== null && rightData.daysOut !== null && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center">
                <p className="text-sm text-muted-foreground mb-1">Better Availability</p>
                <p className="font-semibold text-emerald-500">
                  {leftData.daysOut <= rightData.daysOut ? leftLink : rightLink}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Select two links above to compare their performance
          </div>
        )}
      </CardContent>
    </Card>
  )
}


