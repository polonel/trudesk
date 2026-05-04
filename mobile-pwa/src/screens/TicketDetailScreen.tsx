import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useTicket, usePostComment, usePostNote, useUpdateTicket } from '../hooks/useTickets'
import { useSocket } from '../hooks/useSocket'
import { useAuthStore } from '../store/auth.store'
import StatusBadge from '../components/StatusBadge'
import CommentBubble from '../components/CommentBubble'
import NoteBubble from '../components/NoteBubble'
import BottomSheet from '../components/BottomSheet'
import Avatar from '../components/Avatar'
import { ArrowLeftIcon, TagIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline'
import { getStatuses, getTypes, getGroups, getAgents } from '../api/tickets'
import type { TicketComment, TicketNote } from '../types/ticket'
import type { User } from '../types/user'

dayjs.extend(relativeTime)

type Sheet = 'status' | 'type' | 'priority' | 'group' | 'assignee' | null

export default function TicketDetailScreen() {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const socket = useSocket()
  const user = useAuthStore(s => s.user)

  const { data: ticket, isLoading } = useTicket(uid!)
  const postComment = usePostComment(ticket?._id ?? '', user?._id ?? '')
  const postNote = usePostNote(ticket?._id ?? '')
  const updateTicket = useUpdateTicket(uid!)

  const [commentText, setCommentText] = useState('')
  const [noteMode, setNoteMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [openSheet, setOpenSheet] = useState<Sheet>(null)

  const isAgent = user?.role?.isAgent || user?.role?.isAdmin

  // Picker data — only load when needed
  const { data: statuses } = useQuery({
    queryKey: ['ticket-statuses'],
    queryFn: getStatuses,
    staleTime: Infinity,
  })
  const { data: typesData } = useQuery({
    queryKey: ['ticket-types'],
    queryFn: getTypes,
    staleTime: Infinity,
    enabled: openSheet === 'type' || openSheet === 'priority',
  })
  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
    staleTime: 60_000,
    enabled: openSheet === 'group',
  })
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: getAgents,
    staleTime: 60_000,
    enabled: openSheet === 'assignee',
  })

  const [agentSearch, setAgentSearch] = useState('')
  const [groupSearch, setGroupSearch] = useState('')

  useEffect(() => {
    setAgentSearch('')
    setGroupSearch('')
  }, [openSheet])

  useEffect(() => {
    if (!socket || !ticket) return
    const handler = () => qc.invalidateQueries({ queryKey: ['ticket', uid] })
    socket.on('TICKETS_COMMENT_NOTE_SET', handler)
    socket.on('$trudesk:tickets:update', handler)
    return () => {
      socket.off('TICKETS_COMMENT_NOTE_SET', handler)
      socket.off('$trudesk:tickets:update', handler)
    }
  }, [socket, ticket, uid, qc])

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">Loading…</div>
  }
  if (!ticket) {
    return <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">Ticket not found</div>
  }

  // Priorities filtered to current type
  const allPriorities = typesData?.ticketTypes?.flatMap(t => t.priorities ?? []) ?? []
  const typePriorities = ticket.type?._id
    ? (typesData?.ticketTypes?.find(t => t._id === ticket.type._id)?.priorities ?? allPriorities)
    : allPriorities

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

  const closeSheet = () => setOpenSheet(null)

  const patch = (data: Record<string, unknown>) => {
    updateTicket.mutate(data)
    closeSheet()
  }

  const filteredAgents = (agents ?? []).filter(a =>
    agentSearch === '' ||
    a.fullname.toLowerCase().includes(agentSearch.toLowerCase()) ||
    a.username.toLowerCase().includes(agentSearch.toLowerCase())
  )

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

          {/* Status */}
          <MetaRow
            label="Status"
            editable={isAgent}
            onClick={() => isAgent && setOpenSheet('status')}
          >
            <StatusBadge name={ticket.status.name} color={ticket.status.htmlColor} />
          </MetaRow>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700/60 border-t border-gray-100 dark:border-gray-700/60">
            <MetaCell
              label="Type"
              editable={isAgent}
              onClick={() => isAgent && setOpenSheet('type')}
            >
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ticket.type?.name ?? '—'}</p>
            </MetaCell>
            <MetaCell
              label="Priority"
              editable={isAgent}
              onClick={() => isAgent && setOpenSheet('priority')}
            >
              <div className="flex items-center gap-1.5">
                {ticket.priority?.htmlColor && (
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ticket.priority.htmlColor }}
                  />
                )}
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ticket.priority?.name ?? '—'}</p>
              </div>
            </MetaCell>
          </div>

          {/* Group */}
          <MetaRow
            label="Group"
            editable={isAgent}
            onClick={() => isAgent && setOpenSheet('group')}
            bordered
          >
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ticket.group?.name ?? '—'}</p>
          </MetaRow>

          {/* Assignee */}
          <MetaRow
            label="Assignee"
            editable={isAgent}
            onClick={() => isAgent && setOpenSheet('assignee')}
            bordered
          >
            {ticket.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar name={ticket.assignee.fullname} image={ticket.assignee.image} size="sm" />
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ticket.assignee.fullname}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">Unassigned</p>
            )}
          </MetaRow>

          {/* Tags (read-only for now) */}
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

        {/* Timeline */}
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
        {isAgent && (
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

      {/* ── Bottom Sheets ── */}

      {/* Status */}
      <BottomSheet open={openSheet === 'status'} onClose={closeSheet} title="Set Status">
        <div className="py-2">
          {(statuses ?? []).map(s => (
            <PickerRow
              key={s._id}
              label={s.name}
              selected={ticket.status._id === s._id}
              icon={<span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.htmlColor }} />}
              onSelect={() => patch({ status: s._id })}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Type */}
      <BottomSheet open={openSheet === 'type'} onClose={closeSheet} title="Set Type">
        <div className="py-2">
          {(typesData?.ticketTypes ?? []).map(t => (
            <PickerRow
              key={t._id}
              label={t.name}
              selected={ticket.type?._id === t._id}
              onSelect={() => patch({ type: t._id })}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Priority */}
      <BottomSheet open={openSheet === 'priority'} onClose={closeSheet} title="Set Priority">
        <div className="py-2">
          {typePriorities.map(p => (
            <PickerRow
              key={p._id}
              label={p.name}
              selected={ticket.priority?._id === p._id}
              icon={<span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.htmlColor }} />}
              onSelect={() => patch({ priority: p._id })}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Group */}
      <BottomSheet open={openSheet === 'group'} onClose={closeSheet} title="Set Group">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <input
            type="search"
            placeholder="Search groups…"
            value={groupSearch}
            onChange={e => setGroupSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="py-1">
          <PickerRow
            label="No Group"
            selected={!ticket.group}
            onSelect={() => { patch({ group: null }); setGroupSearch('') }}
          />
          {(groups ?? [])
            .filter(g => groupSearch === '' || g.name.toLowerCase().includes(groupSearch.toLowerCase()))
            .map(g => (
              <PickerRow
                key={g._id}
                label={g.name}
                selected={ticket.group?._id === g._id}
                onSelect={() => { patch({ group: g._id }); setGroupSearch('') }}
              />
            ))}
        </div>
      </BottomSheet>

      {/* Assignee */}
      <BottomSheet open={openSheet === 'assignee'} onClose={closeSheet} title="Assign To">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <input
            type="search"
            placeholder="Search agents…"
            value={agentSearch}
            onChange={e => setAgentSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="py-1">
          <PickerRow
            label="Unassigned"
            selected={!ticket.assignee}
            onSelect={() => { patch({ assignee: null }); setAgentSearch('') }}
          />
          {filteredAgents.map((a: User) => (
            <button
              key={a._id}
              onClick={() => { patch({ assignee: a._id }); setAgentSearch('') }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            >
              <Avatar name={a.fullname} image={a.image} size="sm" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.fullname}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{a.username}</p>
              </div>
              {ticket.assignee?._id === a._id && (
                <CheckIcon className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

interface MetaRowProps {
  label: string
  editable?: boolean
  bordered?: boolean
  onClick?: () => void
  children: React.ReactNode
}

function MetaRow({ label, editable, bordered, onClick, children }: MetaRowProps) {
  return (
    <div
      className={`px-4 py-3 flex items-center justify-between gap-2 ${bordered ? 'border-t border-gray-100 dark:border-gray-700/60' : ''} ${editable ? 'cursor-pointer active:bg-gray-100 dark:active:bg-gray-700/40' : ''}`}
      onClick={onClick}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        {children}
      </div>
      {editable && <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />}
    </div>
  )
}

interface MetaCellProps {
  label: string
  editable?: boolean
  onClick?: () => void
  children: React.ReactNode
}

function MetaCell({ label, editable, onClick, children }: MetaCellProps) {
  return (
    <div
      className={`px-4 py-3 ${editable ? 'cursor-pointer active:bg-gray-100 dark:active:bg-gray-700/40' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
        {editable && <ChevronRightIcon className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />}
      </div>
      {children}
    </div>
  )
}

interface PickerRowProps {
  label: string
  selected?: boolean
  icon?: React.ReactNode
  onSelect: () => void
}

function PickerRow({ label, selected, icon, onSelect }: PickerRowProps) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
    >
      {icon && icon}
      <span className={`flex-1 text-left text-sm ${selected ? 'font-semibold text-primary' : 'font-medium text-gray-800 dark:text-gray-200'}`}>
        {label}
      </span>
      {selected && <CheckIcon className="w-4 h-4 text-primary flex-shrink-0" />}
    </button>
  )
}
