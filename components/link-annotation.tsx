'use client'

import { useState, useEffect } from 'react'
import { StickyNote, Save, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getAnnotation, setAnnotation } from '@/lib/preferences'
import { cn } from '@/lib/utils'

interface LinkAnnotationProps {
  linkName: string
  className?: string
}

export function LinkAnnotation({ linkName, className }: LinkAnnotationProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [hasNote, setHasNote] = useState(false)

  useEffect(() => {
    const saved = getAnnotation(linkName)
    if (saved) {
      setNote(saved)
      setHasNote(true)
    }
  }, [linkName])

  const handleSave = () => {
    setAnnotation(linkName, note)
    setHasNote(!!note)
    setOpen(false)
  }

  const handleDelete = () => {
    setAnnotation(linkName, '')
    setNote('')
    setHasNote(false)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "p-1 rounded hover:bg-amber-500/10 transition-colors",
            className
          )}
          title={hasNote ? 'View/edit note' : 'Add note'}
        >
          <StickyNote 
            className={cn(
              "h-4 w-4 transition-colors",
              hasNote 
                ? "text-amber-500 fill-amber-500/20" 
                : "text-muted-foreground hover:text-amber-500"
            )} 
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Note for {linkName}</h4>
            {hasNote && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this link..."
            className="min-h-[100px] text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-1">
              <Save className="h-3 w-3" />
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Display all annotations
export function AnnotationsList() {
  const [annotations, setAnnotations] = useState<Record<string, string>>({})

  useEffect(() => {
    // This would need to be called with getAllAnnotations()
    // For now, we'll just show this is where annotations would display
  }, [])

  const entries = Object.entries(annotations)

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-amber-500" />
        Your Notes
      </h4>
      <div className="space-y-2">
        {entries.map(([name, note]) => (
          <div 
            key={name}
            className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
          >
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-muted-foreground mt-1">{note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

