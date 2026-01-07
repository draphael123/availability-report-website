'use client'

import { useMemo } from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  showDots?: boolean
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'currentColor',
  showDots = false,
}: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return ''

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return { x, y, value }
    })

    const pathD = points
      .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')

    return { pathD, points }
  }, [data, width, height])

  if (data.length < 2 || !path) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center text-muted-foreground text-xs"
      >
        -
      </div>
    )
  }

  const { pathD, points } = path
  const lastPoint = points[points.length - 1]
  const firstValue = data[0]
  const lastValue = data[data.length - 1]
  const isUp = lastValue >= firstValue

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isUp ? 'stroke-green-500' : 'stroke-red-500'}
      />
      
      {/* Dots */}
      {showDots && points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={2}
          className={isUp ? 'fill-green-500' : 'fill-red-500'}
        />
      ))}

      {/* End dot */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={3}
        className={isUp ? 'fill-green-500' : 'fill-red-500'}
      />
    </svg>
  )
}



