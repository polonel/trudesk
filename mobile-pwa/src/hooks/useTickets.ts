import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTickets, getTicket, updateTicket, postComment, postNote } from '../api/tickets'
import type { TicketFilterType, TicketStatus } from '../types/ticket'

export function useTicketList(type: TicketFilterType = 'active', statuses?: TicketStatus[]) {
  const closedStatusIds = statuses?.filter(s => s.isResolved).map(s => s._id) ?? []

  return useInfiniteQuery({
    queryKey: ['tickets', type, closedStatusIds],
    queryFn: ({ pageParam = 0 }) => {
      const page = pageParam as number

      switch (type) {
        case 'active':
          return getTickets({ type: 'active', limit: 25, page })

        case 'all':
          return getTickets({ limit: 25, page })

        case 'my':
          return getTickets({ type: 'assigned', limit: 25, page })

        case 'unassigned':
          return getTickets({ type: 'unassigned', limit: 25, page })

        case 'closed':
          if (closedStatusIds.length) {
            return getTickets({
              type: 'filter',
              filter: JSON.stringify({ status: closedStatusIds }),
              limit: 25,
              page,
            })
          }
          return getTickets({ limit: 25, page })

        default:
          return getTickets({ limit: 25, page })
      }
    },
    getNextPageParam: (last) => (last.nextPage != null && last.nextPage > last.page ? last.nextPage : undefined),
    initialPageParam: 0,
  })
}

export function useTicket(uid: number | string) {
  return useQuery({
    queryKey: ['ticket', uid],
    queryFn: () => getTicket(uid),
    enabled: Boolean(uid),
  })
}

export function useUpdateTicket(uid: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) => updateTicket(uid, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', uid] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function usePostComment(ticketId: string, ownerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (comment: string) => postComment(ticketId, comment, ownerId),
    onSuccess: (_, __, _ctx) => {
      qc.invalidateQueries({ queryKey: ['ticket'] })
    },
  })
}

export function usePostNote(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (note: string) => postNote(ticketId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket'] })
    },
  })
}
