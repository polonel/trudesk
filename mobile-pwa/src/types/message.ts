import type { User } from './user'

export interface Message {
  _id: string
  owner: User
  body: string
  date: string
}

export interface ConversationUserMeta {
  lastRead?: string
}

export interface Conversation {
  _id: string
  participants: User[]
  messages: Message[]
  lastMessage?: Message
  userMeta?: ConversationUserMeta
  updatedAt: string
}
