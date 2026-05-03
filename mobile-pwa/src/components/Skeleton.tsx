import clsx from 'clsx'

interface Props {
  className?: string
}

export function Skeleton({ className }: Props) {
  return <div className={clsx('animate-pulse bg-gray-200 dark:bg-gray-700 rounded', className)} />
}

export function TicketCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 mx-4 my-2 rounded-xl p-4 shadow-sm dark:shadow-none">
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-3.5 w-14" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3.5 w-1/2 mb-3" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-3.5 w-24 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}
