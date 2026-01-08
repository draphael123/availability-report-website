'use client'

import { ExternalLink, AlertTriangle, Calendar, Clock, Hash } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ParsedSheetRow } from '@/lib/types'

interface RowDrawerProps {
  row: ParsedSheetRow | null
  open: boolean
  onClose: () => void
  headers: string[]
}

export function RowDrawer({ row, open, onClose, headers }: RowDrawerProps) {
  if (!row) return null

  const getDisplayValue = (key: string, value: string) => {
    // Check if it's a URL
    if (key.toLowerCase() === 'url' && value) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          {value.length > 40 ? value.substring(0, 40) + '...' : value}
          <ExternalLink className="h-3 w-3" />
        </a>
      )
    }
    return value || <span className="text-muted-foreground italic">Empty</span>
  }

  const name = row.raw['Name'] || row.raw['name'] || 'Row Details'
  const category = row.raw['Category'] || row.raw['category']
  const location = row.raw['Location'] || row.raw['location']

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <SheetTitle className="text-xl pr-8">{name}</SheetTitle>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {category && (
              <Badge variant="secondary">{category}</Badge>
            )}
            {location && (
              <Badge variant="outline">{location}</Badge>
            )}
            {row.hasError && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Error
              </Badge>
            )}
          </div>

          <SheetDescription>
            Full details for this record
          </SheetDescription>
        </SheetHeader>

        {/* Quick stats */}
        {(row.daysOut !== null || row.availabilityScore !== null || row.scrapedAt) && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {row.daysOut !== null && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Calendar className="h-3 w-3" />
                  Days Out
                </div>
                <div className="text-xl font-semibold">{row.daysOut}</div>
              </div>
            )}
            {row.availabilityScore !== null && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Hash className="h-3 w-3" />
                  Availability Score
                </div>
                <div className="text-xl font-semibold">{row.availabilityScore}</div>
              </div>
            )}
            {row.scrapedAt && (
              <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="h-3 w-3" />
                  Scraped At
                </div>
                <div className="text-sm font-medium">
                  {row.scrapedAt.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator className="my-6" />

        {/* All fields */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            All Fields
          </h4>
          
          <div className="space-y-3">
            {headers.map((header) => {
              const value = row.raw[header]
              const isErrorField = header.toLowerCase().includes('error')
              
              return (
                <div
                  key={header}
                  className={`space-y-1 p-3 rounded-lg ${
                    isErrorField && value ? 'bg-destructive/10' : 'bg-muted/30'
                  }`}
                >
                  <div className="text-xs font-medium text-muted-foreground">
                    {header}
                  </div>
                  <div className="text-sm break-words">
                    {getDisplayValue(header, value)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* URL button if present */}
        {(row.raw['URL'] || row.raw['url']) && (
          <div className="mt-6">
            <Button asChild className="w-full">
              <a
                href={row.raw['URL'] || row.raw['url']}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open URL
              </a>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}




