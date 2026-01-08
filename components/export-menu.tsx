'use client'

import { Download, FileText, FileSpreadsheet, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ParsedSheetRow } from '@/lib/types'
import { downloadCSV, downloadSummaryReport } from '@/lib/export'

interface ExportMenuProps {
  data: ParsedSheetRow[]
  headers: string[]
  filteredCount: number
  totalCount: number
}

export function ExportMenu({ data, headers, filteredCount, totalCount }: ExportMenuProps) {
  const handleExportCSV = () => {
    downloadCSV(data, headers, 'oncehub-availability-report')
  }

  const handleExportReport = () => {
    downloadSummaryReport(data, headers)
  }

  const isFiltered = filteredCount !== totalCount

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Data</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <div className="flex-1">
            <div>Export as CSV</div>
            <div className="text-xs text-muted-foreground">
              {isFiltered ? `${filteredCount} filtered rows` : `All ${totalCount} rows`}
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportReport} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-blue-600" />
          <div className="flex-1">
            <div>Summary Report</div>
            <div className="text-xs text-muted-foreground">Text format with stats</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem disabled className="gap-2 cursor-pointer opacity-50">
          <FileImage className="h-4 w-4 text-purple-600" />
          <div className="flex-1">
            <div>Export Charts</div>
            <div className="text-xs text-muted-foreground">Coming soon</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}




