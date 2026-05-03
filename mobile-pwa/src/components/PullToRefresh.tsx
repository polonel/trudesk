import { useRef, useState, type ReactNode } from 'react'

interface Props {
  onRefresh: () => Promise<void>
  children: ReactNode
  className?: string
}

const THRESHOLD = 72

export default function PullToRefresh({ onRefresh, children, className = '' }: Props) {
  const startY = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const onTouchStart = (e: React.TouchEvent) => {
    if ((scrollRef.current?.scrollTop ?? 0) === 0) {
      startY.current = e.touches[0].clientY
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!startY.current) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0 && (scrollRef.current?.scrollTop ?? 0) === 0) {
      setPullDistance(Math.min(delta, THRESHOLD * 1.5))
    }
  }

  const onTouchEnd = async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      try { await onRefresh() } finally {
        setRefreshing(false)
      }
    }
    startY.current = 0
    setPullDistance(0)
  }

  return (
    <div
      ref={scrollRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`overflow-y-auto ${className}`}
    >
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 transition-all"
          style={{ height: pullDistance }}
        >
          {refreshing || pullDistance >= THRESHOLD ? 'Refreshing…' : 'Pull to refresh'}
        </div>
      )}
      {children}
    </div>
  )
}
