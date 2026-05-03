import api from './axios'
import type { Conversation, Message } from '../types/message'

export async function getConversations(): Promise<Conversation[]> {
  const res = await api.get('/api/v2/messages/conversations')
  return res.data.conversations ?? []
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await api.get(`/api/v2/messages/conversations/${id}`)
  return res.data.conversation
}

export async function sendMessage(to: string, message: string): Promise<Message> {
  const res = await api.post('/api/v2/messages/send', { to, message })
  return res.data.message
}
