'use client'

import { useMemo } from 'react'
import { 
  Trophy, 
  Star, 
  Zap, 
  Shield, 
  Target, 
  Flame,
  Award,
  Crown,
  Gem,
  Medal,
  Lock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ParsedSheetRow } from '@/lib/types'

interface AchievementsProps {
  data: ParsedSheetRow[]
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  unlocked: boolean
  progress?: number
  maxProgress?: number
}

export function Achievements({ data }: AchievementsProps) {
  const achievements = useMemo((): Achievement[] => {
    const totalRows = data.length
    const errorCount = data.filter(r => r.hasError).length
    const errorRate = totalRows > 0 ? (errorCount / totalRows) * 100 : 100
    const successRate = 100 - errorRate
    
    const rowsWithDaysOut = data.filter(r => r.daysOut !== null)
    const avgDaysOut = rowsWithDaysOut.length > 0
      ? rowsWithDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / rowsWithDaysOut.length
      : null

    const uniqueCategories = new Set(data.map(r => r.raw['Category']).filter(Boolean)).size
    const uniqueLocations = new Set(data.map(r => r.raw['Location']).filter(Boolean)).size

    return [
      {
        id: 'first-perfect',
        name: 'Perfect Day',
        description: 'Achieve zero errors across all links',
        icon: <Trophy className="h-5 w-5" />,
        color: 'text-amber-500',
        bgColor: 'from-amber-400 to-yellow-500',
        unlocked: errorCount === 0,
      },
      {
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Average wait time under 7 days',
        icon: <Zap className="h-5 w-5" />,
        color: 'text-purple-500',
        bgColor: 'from-purple-400 to-pink-500',
        unlocked: avgDaysOut !== null && avgDaysOut <= 7,
      },
      {
        id: 'guardian',
        name: 'Guardian',
        description: 'Maintain 95%+ success rate',
        icon: <Shield className="h-5 w-5" />,
        color: 'text-emerald-500',
        bgColor: 'from-emerald-400 to-teal-500',
        unlocked: successRate >= 95,
        progress: Math.min(successRate, 95),
        maxProgress: 95,
      },
      {
        id: 'centurion',
        name: 'Centurion',
        description: 'Monitor 100+ links',
        icon: <Medal className="h-5 w-5" />,
        color: 'text-blue-500',
        bgColor: 'from-blue-400 to-cyan-500',
        unlocked: totalRows >= 100,
        progress: Math.min(totalRows, 100),
        maxProgress: 100,
      },
      {
        id: 'diversifier',
        name: 'Diversifier',
        description: 'Track 10+ different categories',
        icon: <Target className="h-5 w-5" />,
        color: 'text-orange-500',
        bgColor: 'from-orange-400 to-red-400',
        unlocked: uniqueCategories >= 10,
        progress: Math.min(uniqueCategories, 10),
        maxProgress: 10,
      },
      {
        id: 'globe-trotter',
        name: 'Globe Trotter',
        description: 'Monitor 5+ different locations',
        icon: <Crown className="h-5 w-5" />,
        color: 'text-violet-500',
        bgColor: 'from-violet-400 to-indigo-500',
        unlocked: uniqueLocations >= 5,
        progress: Math.min(uniqueLocations, 5),
        maxProgress: 5,
      },
      {
        id: 'streak-master',
        name: 'Streak Master',
        description: 'Keep error rate under 10%',
        icon: <Flame className="h-5 w-5" />,
        color: 'text-rose-500',
        bgColor: 'from-rose-400 to-pink-500',
        unlocked: errorRate < 10,
      },
      {
        id: 'diamond',
        name: 'Diamond Status',
        description: 'All criteria excellent simultaneously',
        icon: <Gem className="h-5 w-5" />,
        color: 'text-cyan-500',
        bgColor: 'from-cyan-400 to-blue-500',
        unlocked: errorCount === 0 && avgDaysOut !== null && avgDaysOut <= 14 && totalRows >= 50,
      },
    ]
  }, [data])

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalAchievements = achievements.length

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/30">
            <Award className="h-4 w-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Achievements
          </span>
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {unlockedCount}/{totalAchievements} unlocked
          </span>
        </CardTitle>
        <CardDescription>
          Earn badges by maintaining excellent performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {achievements.map((achievement) => (
            <Tooltip key={achievement.id}>
              <TooltipTrigger>
                <div
                  className={cn(
                    "aspect-square rounded-xl flex items-center justify-center transition-all duration-300",
                    achievement.unlocked
                      ? `bg-gradient-to-br ${achievement.bgColor} shadow-lg hover:scale-110 cursor-pointer`
                      : "bg-muted/50 cursor-not-allowed"
                  )}
                >
                  {achievement.unlocked ? (
                    <span className="text-white">{achievement.icon}</span>
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={achievement.unlocked ? achievement.color : 'text-muted-foreground'}>
                      {achievement.icon}
                    </span>
                    <span className="font-semibold">{achievement.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  {achievement.progress !== undefined && achievement.maxProgress && !achievement.unlocked && (
                    <div className="pt-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full bg-gradient-to-r", achievement.bgColor)}
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {achievement.progress}/{achievement.maxProgress}
                      </p>
                    </div>
                  )}
                  {achievement.unlocked && (
                    <p className="text-xs text-emerald-500 font-medium">✓ Unlocked!</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

