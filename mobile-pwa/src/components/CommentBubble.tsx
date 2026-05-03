import dayjs from 'dayjs'
import DOMPurify from 'dompurify'
import type { TicketComment } from '../types/ticket'
import Avatar from './Avatar'

interface Props {
  comment: TicketComment
}

export default function CommentBubble({ comment }: Props) {
  return (
    <div className="flex gap-3 py-3">
      <Avatar name={comment.owner?.fullname} image={comment.owner?.image} />
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{comment.owner?.fullname}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{dayjs(comment.date).fromNow()}</span>
        </div>
        <div
          className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.comment) }}
        />
      </div>
    </div>
  )
}
