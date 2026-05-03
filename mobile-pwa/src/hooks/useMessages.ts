import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConversations, getConversation, sendMessage } from '../api/messages'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversation(id),
    enabled: Boolean(id),
  })
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (message: string) => sendMessage(conversationId, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
