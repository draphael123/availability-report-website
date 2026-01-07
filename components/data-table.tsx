'use client'

import { useMemo, useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns,
  ExternalLink,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DataTableProps {
  data: ParsedSheetRow[]
  headers: string[]
  onRowClick: (row: ParsedSheetRow) => void
}

// Score color helper
function getScoreColor(score: number | null): string {
  if (score === null) return 'bg-muted text-muted-foreground'
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (score >= 60) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

// Category type badge colors
function getCategoryTypeBadge(categoryType: string): string {
  switch (categoryType) {
    case 'HRT': return 'badge-hrt'
    case 'TRT': return 'badge-trt'
    case 'Provider': return 'badge-provider'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

// Category badge colors (deterministic based on string)
const categoryColors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
]

function getCategoryColor(category: string): string {
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }
  return categoryColors[Math.abs(hash) % categoryColors.length]
}

export function DataTable({ data, headers, onRowClick }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })

  // Build columns dynamically from headers
  const columns = useMemo<ColumnDef<ParsedSheetRow>[]>(() => {
    // Add category type column first
    const typeColumn: ColumnDef<ParsedSheetRow> = {
      accessorFn: (row) => row.categoryType,
      id: 'Type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.categoryType
        if (type === 'all') return <span className="text-muted-foreground">-</span>
        return (
          <Badge variant="secondary" className={cn('font-medium', getCategoryTypeBadge(type))}>
            {type}
          </Badge>
        )
      },
    }

    const headerColumns = headers.map((header): ColumnDef<ParsedSheetRow> => {
      const lowerHeader = header.toLowerCase()
      
      // Special handling for specific columns
      if (lowerHeader === 'category') {
        return {
          accessorKey: `raw.${header}`,
          id: header,
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              {header}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const value = row.original.raw[header]
            if (!value) return <span className="text-muted-foreground">-</span>
            return (
              <Badge variant="secondary" className={cn('font-medium', getCategoryColor(value))}>
                {value}
              </Badge>
            )
          },
        }
      }

      if (lowerHeader === 'availability score' || lowerHeader === 'availabilityscore') {
        return {
          accessorFn: (row) => row.availabilityScore,
          id: header,
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Score
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const score = row.original.availabilityScore
            return (
              <div className={cn(
                'inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold min-w-[48px]',
                getScoreColor(score)
              )}>
                {score !== null ? score : '-'}
              </div>
            )
          },
        }
      }

      if (lowerHeader === 'days out' || lowerHeader === 'daysout') {
        return {
          accessorFn: (row) => row.daysOut,
          id: header,
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Days Out
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const days = row.original.daysOut
            return (
              <span className="tabular-nums font-medium">
                {days !== null ? (
                  <span className={cn(
                    'px-2 py-0.5 rounded',
                    days <= 7 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    days <= 14 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    days <= 30 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  )}>
                    {days}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </span>
            )
          },
        }
      }

      if (lowerHeader === 'url') {
        return {
          accessorKey: `raw.${header}`,
          id: header,
          header: 'URL',
          cell: ({ row }) => {
            const value = row.original.raw[header]
            if (!value) return <span className="text-muted-foreground">-</span>
            return (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="sr-only">Open</span>
              </a>
            )
          },
        }
      }

      if (lowerHeader.includes('error')) {
        return {
          accessorKey: `raw.${header}`,
          id: header,
          header: header,
          cell: ({ row }) => {
            const value = row.original.raw[header]
            if (!value) return <span className="text-muted-foreground">-</span>
            return (
              <span className="text-destructive text-sm font-medium">
                {value.length > 30 ? value.substring(0, 30) + '...' : value}
              </span>
            )
          },
        }
      }

      // Default column
      return {
        accessorKey: `raw.${header}`,
        id: header,
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {header}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const value = row.original.raw[header]
          if (!value) return <span className="text-muted-foreground">-</span>
          return (
            <span className="truncate max-w-[200px] block" title={value}>
              {value}
            </span>
          )
        },
      }
    })

    return [typeColumn, ...headerColumns]
  }, [headers])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
  })

  return (
    <div className="space-y-4">
      {/* Table toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{data.length}</span> total rows
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[400px] overflow-auto">
            {table.getAllColumns().map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="bg-muted/50">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick(row.original)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    row.original.hasError && 'row-error'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={`${pagination.pageSize}`}
            onValueChange={(value) =>
              setPagination((prev) => ({ ...prev, pageSize: Number(value) }))
            }
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{table.getState().pagination.pageIndex + 1}</span> of{' '}
            <span className="font-medium text-foreground">{table.getPageCount()}</span>
          </span>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
