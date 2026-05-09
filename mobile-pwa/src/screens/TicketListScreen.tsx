import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useTicketList } from '../hooks/useTickets'
import { useSocket } from '../hooks/useSocket'
import { getStatuses } from '../api/tickets'
import type { Ticket, TicketFilterType, TicketListResponse } from '../types/ticket'
import TicketCard from '../components/TicketCard'
import PullToRefresh from '../components/PullToRefresh'
import { TicketCardSkeleton } from '../components/Skeleton'

const FILTERS: { label: string; value: TicketFilterType }[] = [
  { label: 'Active', value: 'active' },
  { label: 'All', value: 'all' },
  { label: 'My Tickets', value: 'my' },
  { label: 'Unassigned', value: 'unassigned' },
  { label: 'Closed', value: 'closed' },
]

export default function TicketListScreen() {
  const qc = useQueryClient()
  const socket = useSocket()
  const [filter, setFilter] = useState<TicketFilterType>('active')

  const { data: statuses } = useQuery({
    queryKey: ['ticket-statuses'],
    queryFn: getStatuses,
    staleTime: Infinity,
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useTicketList(filter, statuses)

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Real-time updates
  useEffect(() => {
    if (!socket) return

    // Ticket updated — patch in-place across every cached filter page so there
    // is no refetch, no flash, and infinite-scroll pagination is not reset.
    const handleUpdate = (updated: Ticket) => {
      qc.setQueriesData<InfiniteData<TicketListResponse>>(
        { queryKey: ['tickets'], type: 'active' },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              tickets: page.tickets.map(t => t._id === updated._id ? updated : t),
            })),
          }
        }
      )
    }

    // New ticket created — invalidate so the query refetches from page 1 in
    // the background; TanStack Query keeps the current list visible until
    // fresh data arrives (no loading flash).
    const handleCreated = () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
    }

    socket.on('$trudesk:tickets:update', handleUpdate)
    socket.on('$trudesk:tickets:created', handleCreated)
    return () => {
      socket.off('$trudesk:tickets:update', handleUpdate)
      socket.off('$trudesk:tickets:created', handleCreated)
    }
  }, [socket, qc])

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const tickets = data?.pages.flatMap(p => p.tickets) ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Filter strip */}
      <div className="flex overflow-x-auto gap-2 px-4 py-2 min-h-[50px] bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 scrollbar-none items-center">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <PullToRefresh onRefresh={async () => { await refetch() }} className="flex-1 min-h-0">
        <div className="pb-20">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <TicketCardSkeleton key={i} />)
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              <p className="text-sm">No tickets found</p>
            </div>
          ) : (
            tickets.map(ticket => <TicketCard key={ticket._id} ticket={ticket} />)
          )}
          <div ref={sentinelRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-3">Loading more…</div>
          )}
        </div>
      </PullToRefresh>
    </div>
  )
}
