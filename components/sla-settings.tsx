'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getSLATargets, setSLATargets, SLATargets } from '@/lib/preferences'

interface SLASettingsProps {
  onUpdate?: (targets: SLATargets) => void
}

export function SLASettings({ onUpdate }: SLASettingsProps) {
  const [open, setOpen] = useState(false)
  const [targets, setTargets] = useState<SLATargets>({
    excellent: 2,
    good: 4,
    acceptable: 7,
  })

  useEffect(() => {
    setTargets(getSLATargets())
  }, [])

  const handleSave = () => {
    setSLATargets(targets)
    onUpdate?.(targets)
    setOpen(false)
  }

  const handleReset = () => {
    const defaults = { excellent: 2, good: 4, acceptable: 7 }
    setTargets(defaults)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          SLA Targets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-500" />
            Configure SLA Targets
          </DialogTitle>
          <DialogDescription>
            Set your wait time thresholds for categorizing link performance.
            Links will be color-coded based on these targets.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Excellent */}
          <div className="space-y-2">
            <Label htmlFor="excellent" className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              Excellent (A+)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">≤</span>
              <Input
                id="excellent"
                type="number"
                min={1}
                max={targets.good - 1}
                value={targets.excellent}
                onChange={(e) => setTargets(prev => ({ 
                  ...prev, 
                  excellent: Math.max(1, parseInt(e.target.value) || 1) 
                }))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Links with wait times at or below this are excellent
            </p>
          </div>

          {/* Good */}
          <div className="space-y-2">
            <Label htmlFor="good" className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              Good (A/B)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">≤</span>
              <Input
                id="good"
                type="number"
                min={targets.excellent + 1}
                max={targets.acceptable - 1}
                value={targets.good}
                onChange={(e) => setTargets(prev => ({ 
                  ...prev, 
                  good: Math.max(prev.excellent + 1, parseInt(e.target.value) || prev.excellent + 1) 
                }))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Links with wait times at or below this are good
            </p>
          </div>

          {/* Acceptable */}
          <div className="space-y-2">
            <Label htmlFor="acceptable" className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              Acceptable (C)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">≤</span>
              <Input
                id="acceptable"
                type="number"
                min={targets.good + 1}
                value={targets.acceptable}
                onChange={(e) => setTargets(prev => ({ 
                  ...prev, 
                  acceptable: Math.max(prev.good + 1, parseInt(e.target.value) || prev.good + 1) 
                }))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Links above this threshold need attention
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm font-medium">Preview:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>0-{targets.excellent}d = Excellent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{targets.excellent + 1}-{targets.good}d = Good</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{targets.good + 1}-{targets.acceptable}d = Acceptable</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>&gt;{targets.acceptable}d = Needs Attention</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </Button>
          <Button onClick={handleSave} className="gap-2 gradient-primary text-white">
            <Save className="h-4 w-4" />
            Save Targets
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

