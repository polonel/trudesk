import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { Ticket } from '../types/ticket'
import StatusBadge from './StatusBadge'
import Avatar from './Avatar'

dayjs.extend(relativeTime)

interface Props {
  ticket: Ticket
}

export default function TicketCard({ ticket }: Props) {
  return (
    <Link
      to={`/tickets/${ticket.uid}`}
      className="block bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 active:bg-gray-50 dark:active:bg-gray-800"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">#{ticket.uid}</span>
            <StatusBadge name={ticket.status.name} color={ticket.status.htmlColor} />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{ticket.subject}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{ticket.group?.name ?? 'No group'}</span>
            <span>·</span>
            <span>{dayjs(ticket.updated ?? ticket.date).fromNow()}</span>
          </div>
        </div>
        {ticket.assignee && (
          <Avatar name={ticket.assignee.fullname} image={ticket.assignee.image} />
        )}
      </div>
    </Link>
  )
}
