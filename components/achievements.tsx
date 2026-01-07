'use client'

import { useMemo } from 'react'
import { 
  Trophy, 
  Zap, 
  Target, 
  Flame,
  Award,
  Crown,
  Rocket,
  Medal,
  Lock,
  Clock,
  TrendingDown,
  Star
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
    const rowsWithDaysOut = data.filter(r => r.daysOut !== null && !r.hasError)
    
    // Calculate wait time distributions
    const within2Days = rowsWithDaysOut.filter(r => r.daysOut! <= 2).length
    const within7Days = rowsWithDaysOut.filter(r => r.daysOut! <= 7).length
    const within14Days = rowsWithDaysOut.filter(r => r.daysOut! <= 14).length
    const under30Days = rowsWithDaysOut.filter(r => r.daysOut! < 30).length
    
    const avgDaysOut = rowsWithDaysOut.length > 0
      ? rowsWithDaysOut.reduce((sum, r) => sum + r.daysOut!, 0) / rowsWithDaysOut.length
      : null

    // Calculate percentages
    const validLinks = rowsWithDaysOut.length
    const pctWithin7Days = validLinks > 0 ? (within7Days / validLinks) * 100 : 0
    const pctWithin14Days = validLinks > 0 ? (within14Days / validLinks) * 100 : 0
    const pctUnder30Days = validLinks > 0 ? (under30Days / validLinks) * 100 : 0

    return [
      {
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Average wait time under 5 days',
        icon: <Zap className="h-5 w-5" />,
        color: 'text-purple-500',
        bgColor: 'from-purple-400 to-pink-500',
        unlocked: avgDaysOut !== null && avgDaysOut < 5,
        progress: avgDaysOut !== null ? Math.max(0, 5 - avgDaysOut) : 0,
        maxProgress: 5,
      },
      {
        id: 'week-warrior',
        name: 'Week Warrior',
        description: '50% of links available within 7 days',
        icon: <Trophy className="h-5 w-5" />,
        color: 'text-amber-500',
        bgColor: 'from-amber-400 to-yellow-500',
        unlocked: pctWithin7Days >= 50,
        progress: Math.min(pctWithin7Days, 50),
        maxProgress: 50,
      },
      {
        id: 'availability-ace',
        name: 'Availability Ace',
        description: '75% of links available within 7 days',
        icon: <Star className="h-5 w-5" />,
        color: 'text-emerald-500',
        bgColor: 'from-emerald-400 to-teal-500',
        unlocked: pctWithin7Days >= 75,
        progress: Math.min(pctWithin7Days, 75),
        maxProgress: 75,
      },
      {
        id: 'instant-access',
        name: 'Instant Access',
        description: '10+ links available within 2 days',
        icon: <Rocket className="h-5 w-5" />,
        color: 'text-blue-500',
        bgColor: 'from-blue-400 to-cyan-500',
        unlocked: within2Days >= 10,
        progress: Math.min(within2Days, 10),
        maxProgress: 10,
      },
      {
        id: 'no-long-waits',
        name: 'No Long Waits',
        description: '90% of links under 30 days',
        icon: <Clock className="h-5 w-5" />,
        color: 'text-orange-500',
        bgColor: 'from-orange-400 to-red-400',
        unlocked: pctUnder30Days >= 90,
        progress: Math.min(pctUnder30Days, 90),
        maxProgress: 90,
      },
      {
        id: 'two-week-target',
        name: '2-Week Target',
        description: '60% of links available within 14 days',
        icon: <Target className="h-5 w-5" />,
        color: 'text-rose-500',
        bgColor: 'from-rose-400 to-pink-500',
        unlocked: pctWithin14Days >= 60,
        progress: Math.min(pctWithin14Days, 60),
        maxProgress: 60,
      },
      {
        id: 'efficiency-expert',
        name: 'Efficiency Expert',
        description: 'Average wait time under 10 days',
        icon: <TrendingDown className="h-5 w-5" />,
        color: 'text-cyan-500',
        bgColor: 'from-cyan-400 to-blue-500',
        unlocked: avgDaysOut !== null && avgDaysOut < 10,
        progress: avgDaysOut !== null ? Math.max(0, 10 - avgDaysOut) : 0,
        maxProgress: 10,
      },
      {
        id: 'availability-champion',
        name: 'Champion',
        description: '90% within 7 days & avg under 7 days',
        icon: <Crown className="h-5 w-5" />,
        color: 'text-violet-500',
        bgColor: 'from-violet-400 to-purple-500',
        unlocked: pctWithin7Days >= 90 && avgDaysOut !== null && avgDaysOut < 7,
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
            Availability Goals
          </span>
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {unlockedCount}/{totalAchievements} achieved
          </span>
        </CardTitle>
        <CardDescription>
          Earn badges by improving wait times
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
                        {achievement.progress.toFixed(0)}/{achievement.maxProgress}
                        {achievement.id.includes('pct') || achievement.id.includes('target') || achievement.id.includes('waits') || achievement.id.includes('warrior') || achievement.id.includes('ace') ? '%' : ''}
                      </p>
                    </div>
                  )}
                  {achievement.unlocked && (
                    <p className="text-xs text-emerald-500 font-medium">✓ Achieved!</p>
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
