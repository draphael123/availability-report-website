'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Tags, 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  Check,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface LinkGroup {
  id: string
  name: string
  color: string
  links: string[] // Array of link names
  createdAt: string
}

const COLORS = [
  { name: 'Red', value: '#ef4444', bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/30' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500/30' },
  { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-500/20', text: 'text-amber-500', border: 'border-amber-500/30' },
  { name: 'Green', value: '#22c55e', bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/30' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500/20', text: 'text-teal-500', border: 'border-teal-500/30' },
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/30' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500/30' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500/20', text: 'text-pink-500', border: 'border-pink-500/30' },
]

const STORAGE_KEY = 'oncehub-link-groups'

function getGroups(): LinkGroup[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveGroups(groups: LinkGroup[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
}

interface LinkGroupsManagerProps {
  data: ParsedSheetRow[]
  onFilterByGroup?: (groupId: string | null) => void
  activeGroupId?: string | null
}

export function LinkGroupsManager({ data, onFilterByGroup, activeGroupId }: LinkGroupsManagerProps) {
  const [groups, setGroups] = useState<LinkGroup[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupColor, setNewGroupColor] = useState(COLORS[0].value)
  const [editingGroup, setEditingGroup] = useState<LinkGroup | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    setGroups(getGroups())
  }, [])

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return
    
    const newGroup: LinkGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      color: newGroupColor,
      links: [],
      createdAt: new Date().toISOString(),
    }
    
    const updated = [...groups, newGroup]
    setGroups(updated)
    saveGroups(updated)
    setNewGroupName('')
    setIsCreateOpen(false)
  }

  const handleDeleteGroup = (groupId: string) => {
    const updated = groups.filter(g => g.id !== groupId)
    setGroups(updated)
    saveGroups(updated)
    if (activeGroupId === groupId) {
      onFilterByGroup?.(null)
    }
  }

  const handleUpdateGroup = (group: LinkGroup) => {
    const updated = groups.map(g => g.id === group.id ? group : g)
    setGroups(updated)
    saveGroups(updated)
    setEditingGroup(null)
  }

  const handleAddLinkToGroup = (groupId: string, linkName: string) => {
    const updated = groups.map(g => {
      if (g.id === groupId && !g.links.includes(linkName)) {
        return { ...g, links: [...g.links, linkName] }
      }
      return g
    })
    setGroups(updated)
    saveGroups(updated)
  }

  const handleRemoveLinkFromGroup = (groupId: string, linkName: string) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, links: g.links.filter(l => l !== linkName) }
      }
      return g
    })
    setGroups(updated)
    saveGroups(updated)
  }

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const getColorConfig = (colorValue: string) => {
    return COLORS.find(c => c.value === colorValue) || COLORS[0]
  }

  return (
    <Card className="glass border-purple-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tags className="h-5 w-5 text-purple-500" />
              <span className="text-gradient-primary">Link Groups</span>
            </CardTitle>
            <CardDescription>Organize links into custom groups</CardDescription>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a custom group to organize related links
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Group Name</label>
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Priority Clinics"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setNewGroupColor(color.value)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          newGroupColor === color.value 
                            ? "border-white scale-110" 
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No groups created yet</p>
            <p className="text-xs">Create a group to organize your links</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* All Links option */}
            <button
              onClick={() => onFilterByGroup?.(null)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                activeGroupId === null 
                  ? "bg-purple-500/20 border border-purple-500/30" 
                  : "hover:bg-muted"
              )}
            >
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
              <span className="font-medium text-sm">All Links</span>
              <Badge variant="outline" className="ml-auto">
                {data.length}
              </Badge>
            </button>

            {groups.map(group => {
              const colorConfig = getColorConfig(group.color)
              const isExpanded = expandedGroups.has(group.id)
              const isActive = activeGroupId === group.id
              const groupLinks = data.filter(row => group.links.includes(row.raw['Name'] || ''))

              return (
                <div key={group.id} className="space-y-1">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                      isActive ? `${colorConfig.bg} border ${colorConfig.border}` : "hover:bg-muted"
                    )}
                  >
                    <button
                      onClick={() => toggleGroupExpanded(group.id)}
                      className="p-0.5 hover:bg-muted rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => onFilterByGroup?.(group.id)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <div 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="font-medium text-sm truncate">{group.name}</span>
                      <Badge variant="outline" className={cn("ml-auto", colorConfig.text)}>
                        {group.links.length}
                      </Badge>
                    </button>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-48">
                        <div className="space-y-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => setEditingGroup(group)}
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit Group
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Group
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Expanded links */}
                  {isExpanded && (
                    <div className="ml-6 pl-4 border-l border-muted space-y-1">
                      {groupLinks.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No links in this group</p>
                      ) : (
                        groupLinks.map(row => (
                          <div 
                            key={row.rowIndex}
                            className="flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-muted"
                          >
                            <span className="truncate flex-1">{row.raw['Name']}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {row.daysOut !== null ? `${row.daysOut}d` : 'N/A'}
                            </Badge>
                            <button
                              onClick={() => handleRemoveLinkFromGroup(group.id, row.raw['Name'] || '')}
                              className="p-1 hover:bg-red-500/10 rounded text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Button to add a link to a group (for use in tables/lists)
export function AddToGroupButton({ 
  linkName, 
  className 
}: { 
  linkName: string
  className?: string 
}) {
  const [groups, setGroups] = useState<LinkGroup[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setGroups(getGroups())
  }, [open])

  const handleAddToGroup = (groupId: string) => {
    const updated = groups.map(g => {
      if (g.id === groupId && !g.links.includes(linkName)) {
        return { ...g, links: [...g.links, linkName] }
      }
      return g
    })
    setGroups(updated)
    saveGroups(updated)
    setOpen(false)
  }

  const linkGroups = groups.filter(g => g.links.includes(linkName))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "p-1 rounded hover:bg-purple-500/10 transition-colors",
            className
          )}
          title="Add to group"
        >
          <Tags 
            className={cn(
              "h-4 w-4 transition-colors",
              linkGroups.length > 0 
                ? "text-purple-500" 
                : "text-muted-foreground hover:text-purple-500"
            )} 
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="space-y-2">
          <p className="text-sm font-medium">Add to Group</p>
          {groups.length === 0 ? (
            <p className="text-xs text-muted-foreground">No groups created yet</p>
          ) : (
            groups.map(group => {
              const isInGroup = group.links.includes(linkName)
              const colorConfig = COLORS.find(c => c.value === group.color) || COLORS[0]
              
              return (
                <button
                  key={group.id}
                  onClick={() => handleAddToGroup(group.id)}
                  disabled={isInGroup}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                    isInGroup 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:bg-muted"
                  )}
                >
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="truncate flex-1 text-left">{group.name}</span>
                  {isInGroup && <Check className="h-4 w-4 text-green-500" />}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Export utility to get groups for filtering
export function getLinkGroups(): LinkGroup[] {
  return getGroups()
}

export function getLinkGroupById(id: string): LinkGroup | undefined {
  return getGroups().find(g => g.id === id)
}

