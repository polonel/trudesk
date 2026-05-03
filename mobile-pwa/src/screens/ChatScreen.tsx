import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useConversation, useSendMessage } from '../hooks/useMessages'
import { useSocket } from '../hooks/useSocket'
import { useAuthStore } from '../store/auth.store'
import Avatar from '../components/Avatar'
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import type { Message } from '../types/message'

export default function ChatScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const socket = useSocket()
  const user = useAuthStore(s => s.user)

  const { data: conversation, isLoading, refetch } = useConversation(id!)
  const sendMessage = useSendMessage(id!)

  const [text, setText] = useState('')
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const other = conversation?.participants?.find(p => p._id !== user?._id)

  // iOS keyboard — push composer above keyboard
  useEffect(() => {
    const handler = () => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    window.visualViewport?.addEventListener('resize', handler)
    return () => window.visualViewport?.removeEventListener('resize', handler)
  }, [])

  // Real-time messages
  useEffect(() => {
    if (!socket) return
    const onReceive = (msg: Message) => {
      setLocalMessages(prev => [...prev, msg])
      refetch()
    }
    const onTyping = (data: { user: string }) => {
      setTypingUser(data.user)
    }
    const onStopTyping = () => setTypingUser(null)

    socket.on('MESSAGES_UI_RECEIVE', onReceive)
    socket.on('MESSAGES_UI_USER_TYPING', onTyping)
    socket.on('MESSAGES_UI_USER_STOP_TYPING', onStopTyping)
    return () => {
      socket.off('MESSAGES_UI_RECEIVE', onReceive)
      socket.off('MESSAGES_UI_USER_TYPING', onTyping)
      socket.off('MESSAGES_UI_USER_STOP_TYPING', onStopTyping)
    }
  }, [socket, refetch])

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [conversation, localMessages])

  const handleTyping = useCallback(() => {
    socket?.emit('MESSAGES_USER_TYPING', { convo: id })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      socket?.emit('MESSAGES_USER_STOP_TYPING', { convo: id })
    }, 300)
  }, [socket, id])

  const handleSend = async () => {
    if (!text.trim()) return
    const body = text
    setText('')
    socket?.emit('MESSAGES_USER_STOP_TYPING', { convo: id })
    await sendMessage.mutateAsync(body)
  }

  const messages = conversation?.messages ?? []

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">Loading…</div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <Avatar name={other?.fullname} image={other?.image} />
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{other?.fullname ?? 'Chat'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-4">
        {messages.map(msg => {
          const isOwn = msg.owner?._id === user?._id
          return (
            <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isOwn ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'}`}>
                <p>{msg.body}</p>
                <p className={`text-xs mt-0.5 ${isOwn ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                  {dayjs(msg.date).format('HH:mm')}
                </p>
              </div>
            </div>
          )
        })}
        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
              {typingUser} is typing…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex gap-2">
        <input
          value={text}
          onChange={e => { setText(e.target.value); handleTyping() }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Message…"
          className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="w-9 h-9 flex items-center justify-center bg-primary rounded-full disabled:opacity-40"
        >
          <PaperAirplaneIcon className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
