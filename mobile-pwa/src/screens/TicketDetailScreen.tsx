import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useTicket, usePostComment, usePostNote } from '../hooks/useTickets'
import { useSocket } from '../hooks/useSocket'
import { useAuthStore } from '../store/auth.store'
import StatusBadge from '../components/StatusBadge'
import CommentBubble from '../components/CommentBubble'
import NoteBubble from '../components/NoteBubble'
import { ArrowLeftIcon, TagIcon } from '@heroicons/react/24/outline'
import Avatar from '../components/Avatar'
import type { TicketComment, TicketNote } from '../types/ticket'

dayjs.extend(relativeTime)

export default function TicketDetailScreen() {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const socket = useSocket()
  const user = useAuthStore(s => s.user)

  const { data: ticket, isLoading } = useTicket(uid!)
  const postComment = usePostComment(ticket?._id ?? '', user?._id ?? '')
  const postNote = usePostNote(ticket?._id ?? '')

  const [commentText, setCommentText] = useState('')
  const [noteMode, setNoteMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!socket || !ticket) return
    const handler = () => qc.invalidateQueries({ queryKey: ['ticket', uid] })
    socket.on('TICKETS_COMMENT_NOTE_SET', handler)
    return () => { socket.off('TICKETS_COMMENT_NOTE_SET', handler) }
  }, [socket, ticket, uid, qc])

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">Loading…</div>
  }
  if (!ticket) {
    return <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">Ticket not found</div>
  }

  // Merge comments + notes sorted by date
  type TimelineItem =
    | { kind: 'comment'; item: TicketComment }
    | { kind: 'note'; item: TicketNote }

  const timeline: TimelineItem[] = [
    ...(ticket.comments ?? []).map(c => ({ kind: 'comment' as const, item: c })),
    ...(ticket.notes ?? []).map(n => ({ kind: 'note' as const, item: n })),
  ].sort((a, b) => new Date(a.item.date).getTime() - new Date(b.item.date).getTime())

  const handleSubmit = async () => {
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      if (noteMode) {
        await postNote.mutateAsync(commentText)
      } else {
        await postComment.mutateAsync(commentText)
      }
      setCommentText('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <span className="text-sm font-mono text-gray-400 dark:text-gray-500">#{ticket.uid}</span>
        <StatusBadge name={ticket.status.name} color={ticket.status.htmlColor} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pb-36 px-4">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">{ticket.subject}</h1>
        <div
          className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none mb-4"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ticket.issue) }}
        />

        {/* Ticket metadata */}
        <div className="mb-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 overflow-hidden">
          {/* Type + Priority row */}
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700/60">
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Type</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ticket.type?.name ?? '—'}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Priority</p>
              <div className="flex items-center gap-1.5">
                {ticket.priority?.htmlColor && (
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ticket.priority.htmlColor }}
                  />
                )}
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ticket.priority?.name ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Group */}
          {ticket.group && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Group</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ticket.group.name}</p>
            </div>
          )}

          {/* Assignee */}
          {ticket.assignee && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Assignee</p>
              <div className="flex items-center gap-2">
                <Avatar name={ticket.assignee.fullname} image={ticket.assignee.image} size="sm" />
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ticket.assignee.fullname}</p>
              </div>
            </div>
          )}

          {/* Tags */}
          {ticket.tags?.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map(tag => (
                  <span
                    key={tag._id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300"
                  >
                    <TagIcon className="w-3 h-3" />
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          {timeline.map(entry =>
            entry.kind === 'comment'
              ? <CommentBubble key={entry.item._id} comment={entry.item} />
              : <NoteBubble key={entry.item._id} note={entry.item} />
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 pt-2 pb-2">
        {user?.role?.isAgent && (
          <div className="flex gap-3 mb-1">
            <button
              onClick={() => setNoteMode(false)}
              className={`text-xs font-medium ${!noteMode ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
            >
              Comment
            </button>
            <button
              onClick={() => setNoteMode(true)}
              className={`text-xs font-medium ${noteMode ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}
            >
              Internal Note
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={noteMode ? 'Add internal note…' : 'Add comment…'}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !commentText.trim()}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
