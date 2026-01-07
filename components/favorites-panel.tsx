'use client'

import { useState, useEffect } from 'react'
import { Star, ExternalLink, X, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getFavorites, toggleFavorite, getSLATargets, getSLAStatus } from '@/lib/preferences'
import { ParsedSheetRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FavoritesPanelProps {
  data: ParsedSheetRow[]
  onSelectLink?: (row: ParsedSheetRow) => void
}

export function FavoritesPanel({ data, onSelectLink }: FavoritesPanelProps) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [slaTargets, setSlaTargets] = useState(getSLATargets())

  useEffect(() => {
    setFavorites(getFavorites())
    setSlaTargets(getSLATargets())
  }, [])

  const favoriteRows = data.filter(row => {
    const name = row.raw['Name'] || ''
    return favorites.includes(name)
  })

  const handleRemoveFavorite = (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = toggleFavorite(name)
    setFavorites(updated)
  }

  if (favorites.length === 0) {
    return null
  }

  return (
    <Card className="glass border-amber-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Favorite Links
          </span>
          <Badge variant="outline" className="ml-auto bg-amber-500/10 text-amber-500 border-amber-500/30">
            {favoriteRows.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Your starred links for quick access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteRows.map((row) => {
            const name = row.raw['Name'] || 'Unknown'
            const location = row.raw['Location'] || 'Unknown'
            const url = row.raw['URL'] || ''
            const slaStatus = getSLAStatus(row.daysOut, slaTargets)

            return (
              <div
                key={row.rowIndex}
                onClick={() => onSelectLink?.(row)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  "hover:shadow-md hover:-translate-y-0.5",
                  "bg-gradient-to-br from-amber-500/5 to-orange-500/5",
                  "border-amber-500/20 hover:border-amber-500/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="font-medium text-sm truncate" title={name}>
                        {name}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {location}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 hover:bg-red-500/10 hover:text-red-500"
                    onClick={(e) => handleRemoveFavorite(name, e)}
                    title="Remove from favorites"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", slaStatus.color)} />
                    <span className="text-xs font-medium">
                      {row.daysOut !== null ? `${row.daysOut}d` : 'N/A'}
                    </span>
                    {row.hasError && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 bg-red-500/10 text-red-500 border-red-500/30">
                        Error
                      </Badge>
                    )}
                  </div>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-500 hover:text-blue-400"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {favoriteRows.length === 0 && favorites.length > 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Your favorited links are not in the current filtered view
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Star button for use in tables/lists
export function FavoriteButton({ 
  linkName, 
  className 
}: { 
  linkName: string
  className?: string 
}) {
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    setIsFav(getFavorites().includes(linkName))
  }, [linkName])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = toggleFavorite(linkName)
    setIsFav(updated.includes(linkName))
  }

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "p-1 rounded hover:bg-amber-500/10 transition-colors",
        className
      )}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star 
        className={cn(
          "h-4 w-4 transition-colors",
          isFav ? "text-amber-500 fill-amber-500" : "text-muted-foreground hover:text-amber-500"
        )} 
      />
    </button>
  )
}

