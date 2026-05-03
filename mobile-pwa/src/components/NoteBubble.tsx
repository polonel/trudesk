import dayjs from 'dayjs'
import DOMPurify from 'dompurify'
import type { TicketNote } from '../types/ticket'
import Avatar from './Avatar'

interface Props {
  note: TicketNote
}

export default function NoteBubble({ note }: Props) {
  return (
    <div className="flex gap-3 py-3 bg-amber-50 dark:bg-amber-950/40 px-3 rounded-lg my-1">
      <Avatar name={note.owner?.fullname} image={note.owner?.image} />
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-amber-900 dark:text-amber-200">{note.owner?.fullname}</span>
          <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">Internal Note</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{dayjs(note.date).fromNow()}</span>
        </div>
        <div
          className="text-sm text-amber-800 dark:text-amber-300 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.note) }}
        />
      </div>
    </div>
  )
}
