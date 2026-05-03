import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useConversations } from '../hooks/useMessages'
import { useSocket } from '../hooks/useSocket'
import { useAuthStore } from '../store/auth.store'
import Avatar from '../components/Avatar'

dayjs.extend(relativeTime)

export default function MessagesScreen() {
  const qc = useQueryClient()
  const socket = useSocket()
  const user = useAuthStore(s => s.user)
  const { data: conversations = [], isLoading } = useConversations()

  useEffect(() => {
    if (!socket) return
    const handler = () => qc.invalidateQueries({ queryKey: ['conversations'] })
    socket.on('MESSAGES_UI_RECEIVE', handler)
    return () => { socket.off('MESSAGES_UI_RECEIVE', handler) }
  }, [socket, qc])

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">Loading…</div>
  }

  if (!sorted.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <p className="text-sm">No conversations yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto pb-20">
      {sorted.map(conv => {
        const other = conv.participants?.find(p => p._id !== user?._id)
        const lastMsg = conv.lastMessage
        const unread =
          lastMsg && conv.userMeta?.lastRead
            ? new Date(lastMsg.date) > new Date(conv.userMeta.lastRead)
            : false

        return (
          <Link
            key={conv._id}
            to={`/messages/${conv._id}`}
            className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800"
          >
            <Avatar name={other?.fullname} image={other?.image} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${unread ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                  {other?.fullname ?? 'Unknown'}
                </span>
                {lastMsg && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{dayjs(lastMsg.date).fromNow()}</span>
                )}
              </div>
              {lastMsg && (
                <p className={`text-xs truncate mt-0.5 ${unread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-500'}`}>
                  {lastMsg.body}
                </p>
              )}
            </div>
            {unread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
          </Link>
        )
      })}
    </div>
  )
}
